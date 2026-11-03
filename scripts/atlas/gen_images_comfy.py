"""Illustrate words through a ComfyUI Qwen-Image workflow, one everyday sentence per picture.

The workflow file is the single source of truth: it carries the prompt template with
{{placeholders}}, the negative prompt, sampler settings and the save prefix. This script
only fills the placeholders, queues the graph on ComfyUI and stores the result.

Regenerate the workflow with: python3 scripts/atlas/build_workflow.py

Usage:
  python3 scripts/atlas/gen_images_comfy.py --dry-run --only library,body   # print the prompt only
  python3 scripts/atlas/gen_images_comfy.py --fast --limit 4                # cheapest probe
  python3 scripts/atlas/gen_images_comfy.py                                 # every word

Output: .local/forge/comfy/<word>.<ext> (resumable; a changed prompt re-renders)
"""
import argparse
import concurrent.futures as cf
import hashlib
import json
import pathlib
import random
import threading
import time
import urllib.parse
import urllib.request

from common import FORGE, ROOT, post_json

WORKFLOW = ROOT / "（越狱版）image_qwen_image_2_1_t2i_gguf.json"
RANK = {c: i for i, c in enumerate(["A1", "A2", "B1", "B2", "C1", "C2"])}
SKIP_TYPES = {"Note", "MarkdownNote", "Reroute"}
IMAGE_EXT = (".webp", ".png", ".jpg")


def load_manifest(path):
    try:
        return json.loads(path.read_text())
    except Exception:
        return {}


def save_manifest(path, data):
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(data), encoding="utf-8")
    tmp.replace(path)  # atomic: a crash never leaves half a manifest


def load_workflow(path):
    return json.loads(pathlib.Path(path).read_text(encoding="utf-8"))


def to_api(wf):
    """UI workflow -> /prompt payload. Widgets come from widgets_values_named; links from the links table."""
    links = {(dst, slot): (src, sslot) for _lid, src, sslot, dst, slot, _t in wf["links"]}
    api = {}
    for n in wf["nodes"]:
        if n["type"] in SKIP_TYPES:
            continue
        inputs = dict(n.get("widgets_values_named") or {})
        inputs.pop("control_after_generate", None)  # frontend-only widget
        for i, inp in enumerate(n.get("inputs") or []):
            if inp.get("link") is not None and "widget" not in inp:
                src, sslot = links[(n["id"], i)]
                inputs[inp["name"]] = [str(src), sslot]
        api[str(n["id"])] = {"class_type": n["type"], "inputs": inputs}
    return api


def text_node(wf):
    for n in wf["nodes"]:
        if n["type"].startswith("TextEncode") and "prompt" in (n.get("widgets_values_named") or {}):
            return n
    raise SystemExit("workflow has no text-encode node with a prompt widget")


def entries():
    """Word id -> the fields the template needs, straight from the shipped vocabulary."""
    out = {}
    for e in json.loads((ROOT / "data" / "word-atlas.json").read_text(encoding="utf-8")):
        ex = (e.get("ex") or [{}])[0].get("en", "").strip()
        if not ex:
            continue
        s = (e.get("senses") or [{}])[0]
        out[e["id"]] = {
            "word": e["w"],
            "pos": s.get("pos", ""),
            "sense_en": s.get("en", ""),
            "example_en": ex,
            "cefr": e.get("cefr", ""),
        }
    return out


def fill(template, e, scene=""):
    """Fill the workflow template. `scene` stays for one-off overrides; the sentence is the spec."""
    text = template
    for key, value in (
        ("example_en", e["example_en"]),
        ("word", e["word"]),
        ("pos", e["pos"]),
        ("sense_en", e["sense_en"]),
        ("scene", scene),
    ):
        text = text.replace("{{" + key + "}}", value)
    if "{{" in text:
        raise ValueError("unfilled placeholder: " + text.split("{{")[1].split("}}")[0])
    return text.strip()


def queue(base, payload):
    raw = post_json(base + "/prompt", payload, {}, timeout=60)
    d = json.loads(raw)
    if d.get("node_errors"):
        raise RuntimeError("node_errors: " + json.dumps(d["node_errors"])[:300])
    return d["prompt_id"]


def node_info(base, names):
    """Only the schemas we need - the full /object_info dump is tens of megabytes."""
    out = {}
    for name in names:
        with urllib.request.urlopen(f"{base}/object_info/{name}", timeout=30) as r:
            out.update(json.loads(r.read()))
    return out


def heal(payload, oi):
    """Swap model files / enum values the target ComfyUI does not have for one it does."""
    fields = {"UnetLoaderGGUF": "unet_name", "CLIPLoader": "clip_name", "VAELoader": "vae_name"}
    for node in payload.values():
        ct = node["class_type"]
        for name in filter(None, (fields.get(ct), "sampler_name" if ct == "KSampler" else None)):
            spec = oi.get(ct, {}).get("input", {}).get("required", {}).get(name) or [None]
            enum = spec[0] if isinstance(spec[0], list) else None
            cur = node["inputs"].get(name)
            if enum and cur not in enum:
                node["inputs"][name] = enum[0]
                print(f"note: {ct}.{name} = {cur!r} is not installed there, using {enum[0]!r}", flush=True)


def tune(payload, size=None, steps=None, cfg=None, sampler=None):
    for node in payload.values():
        ct = node["class_type"]
        if ct == "EmptyLatentImage" and size:
            node["inputs"]["width"] = node["inputs"]["height"] = size
        elif ct.startswith("TextEncode") and size and "resolution" in node["inputs"]:
            node["inputs"]["resolution"] = size
        elif ct == "KSampler":
            if steps is not None:
                node["inputs"]["steps"] = steps
            if cfg is not None:
                node["inputs"]["cfg"] = cfg
            if sampler:
                node["inputs"]["sampler_name"] = sampler


def wait(base, pid, timeout=900):
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(f"{base}/history/{pid}", timeout=30) as r:
                hist = json.loads(r.read())
        except Exception:
            hist = {}
        if pid in hist:
            status = hist[pid].get("status", {})
            if status.get("status_str") == "error":
                raise RuntimeError("comfy error: " + json.dumps(status.get("messages", []))[:300])
            files = [i for o in hist[pid].get("outputs", {}).values() for i in o.get("images", [])]
            if files:
                return files
        time.sleep(1.5)
    raise TimeoutError("comfyui did not finish in %ss" % timeout)


def download(base, info, out):
    q = urllib.parse.urlencode({
        "filename": info["filename"],
        "subfolder": info.get("subfolder", ""),
        "type": info.get("type", "output"),
    })
    with urllib.request.urlopen(f"{base}/view?{q}", timeout=120) as r:
        data = r.read()
    tmp = out.parent / (out.name + ".part")
    tmp.write_bytes(data)
    tmp.replace(out)  # atomic: readers never see a half-written file
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://127.0.0.1:8188", help="ComfyUI address")
    ap.add_argument("--workflow", default=str(WORKFLOW))
    ap.add_argument("--out", default="comfy")
    ap.add_argument("--workers", type=int, default=1, help="parallel jobs (a single local GPU wants 1)")
    ap.add_argument("--only", default="", help="comma separated word ids")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--shard", default="0/1")
    ap.add_argument("--seed", type=int, default=None, help="pin the seed; default is random per image")
    ap.add_argument("--size", type=int, default=0, help="square side in px; overrides the latent node")
    ap.add_argument("--steps", type=int, default=0, help="override sampler steps")
    ap.add_argument("--cfg", type=float, default=0.0, help="override cfg (needs >=2 for the negative prompt)")
    ap.add_argument("--timeout", type=int, default=1800, help="seconds to wait for one image")
    ap.add_argument("--fast", action="store_true", help="cheapest probe: 512px, 6 steps, cfg 2.0")
    ap.add_argument("--dry-run", action="store_true", help="print the filled prompt, do not call ComfyUI")
    a = ap.parse_args()

    base = a.base.rstrip("/")
    wf = load_workflow(a.workflow)
    node = text_node(wf)
    template = node["widgets_values_named"]["prompt"]
    negative = node["widgets_values_named"].get("negative_prompt", "")
    api = to_api(wf)
    if a.fast:
        a.size = a.size or 512
        a.steps = a.steps or 6
        a.cfg = a.cfg or 2.0
    if not a.dry_run:
        heal(api, node_info(base, ["UnetLoaderGGUF", "CLIPLoader", "VAELoader", "KSampler"]))
    tune(api, a.size or None, a.steps or None, a.cfg or None)
    words = entries()
    only = {x.strip() for x in a.only.split(",") if x.strip()}
    si, sn = (int(x) for x in a.shard.split("/"))
    outdir = FORGE / a.out
    outdir.mkdir(parents=True, exist_ok=True)
    lock = threading.Lock()
    stats = {"ok": 0, "fail": 0, "cached": 0}

    todo = [
        w for w in words
        if (not only or w in only) and int(hashlib.sha1(w.encode()).hexdigest(), 16) % sn == si
    ]
    # Learning-path order: easier levels first, so the visible catalogue fills up early.
    todo.sort(key=lambda w: (RANK.get(words[w]["cefr"], 3), w))
    if a.limit:
        todo = todo[: a.limit]

    prompts = {w: fill(template, words[w]) for w in todo}
    digests = {w: hashlib.sha1(t.encode()).hexdigest() for w, t in prompts.items()}
    man_path = outdir / ".manifest.json"
    man = load_manifest(man_path)
    pending = [0]

    def flush():
        save_manifest(man_path, man)
        pending[0] = 0

    def done(w):
        """Reuse an image only if it was made from this exact prompt; a reworded sentence must re-render."""
        if not any(p.suffix in IMAGE_EXT and not p.name.endswith(".part") for p in outdir.glob(w + ".*")):
            return False
        if man.get(w) == digests[w]:
            return True
        if w not in man:  # legacy image with no record: adopt it instead of rebuilding the whole catalogue
            man[w] = digests[w]
            pending[0] += 1
            return True
        return False

    def run(w):
        t0 = time.time()
        prompt = prompts[w]
        if a.dry_run:
            print(f"\n=== {w} ===\n{prompt}\n--- negative ---\n{negative}")
            with lock:
                stats["ok"] += 1
            return
        payload = json.loads(json.dumps(api))
        payload[str(node["id"])]["inputs"]["prompt"] = prompt
        for n in payload.values():
            if n["class_type"] == "KSampler":
                n["inputs"]["seed"] = a.seed if a.seed is not None else random.randrange(2**48)
            elif n["class_type"].startswith("SaveImage"):
                n["inputs"]["filename_prefix"] = "word-atlas/" + w
        pid = queue(base, {"prompt": payload, "client_id": "word-atlas"})
        files = wait(base, pid, timeout=a.timeout)
        ext = pathlib.Path(files[0]["filename"]).suffix or ".png"
        download(base, files[0], outdir / (w + ext))
        with lock:
            man[w] = digests[w]
            stats["ok"] += 1
            print(f"ok {w} ({stats['ok']}/{len(todo)}) -> {outdir.name}/{w}{ext}  {time.time() - t0:.1f}s", flush=True)

    start = time.time()
    try:
        work(todo, run, done, stats, a, flush)
    finally:
        if not a.dry_run:
            flush()
    print(f"finished in {time.time() - start:.1f}s", stats, flush=True)


def work(todo, run, done, stats, a, flush):
    if a.workers <= 1:
        for w in todo:
            if not a.dry_run and done(w):
                stats["cached"] += 1
                continue
            try:
                run(w)
            except Exception as ex:
                stats["fail"] += 1
                print("FAIL", w, str(ex)[:200], flush=True)
            if stats["ok"] and stats["ok"] % 20 == 0:
                print(f"{time.strftime('%H:%M:%S')} ok={stats['ok']} fail={stats['fail']} cached={stats['cached']}", flush=True)
            if stats["ok"] and stats["ok"] % 10 == 0:
                flush()
    else:
        with cf.ThreadPoolExecutor(a.workers) as pool:
            futs = {}
            for w in todo:
                if done(w):
                    stats["cached"] += 1
                    continue
                futs[pool.submit(run, w)] = w
            for f in cf.as_completed(futs):
                try:
                    f.result()
                except Exception as ex:
                    stats["fail"] += 1
                    print("FAIL", futs[f], str(ex)[:200], flush=True)


if __name__ == "__main__":
    main()
