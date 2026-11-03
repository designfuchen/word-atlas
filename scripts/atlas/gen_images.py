"""Illustrate every entry in one cohesive art direction (resumable, follows gen_text output).

Usage: python3 scripts/atlas/gen_images.py [--workers 6] [--only hid,hid] [--follow]
Output: .local/forge/img/<hid>.webp (768px) + raw png discarded.

The prompt is scene-first: the entry's everyday sentence is the specification and the
art direction only dresses it. Images are cached against a hash of the full prompt, so
rewording a sentence re-renders that entry instead of silently keeping the old picture.
"""
import argparse
import base64
import concurrent.futures as cf
import hashlib
import json
import shutil
import subprocess
import threading
import time

from common import FORGE, load_env, post_json, with_retry

STYLE = (
    "Mid-century modern editorial illustration, like a plate from a vintage illustrated field guide. "
    "Strict limited palette: deep ink navy, warm terracotta, mustard ochre, muted sage green and soft sky blue on warm cream paper. "
    "Flat geometric shapes, confident clean silhouettes, subtle risograph grain and paper texture, gentle shading, "
    "one clear focal group or a readable action with every participant visible, generous negative space, "
    "centered square composition, calm and charming mood, textless."
)

BODY = (
    "Draw the same action, the same objects, the same number of people or things, the same place, and the same time "
    "of day the sentence states. If the sentence states a habitual or general truth rather than one event, depict the "
    "typical instance it implies, at the moment it puts itself in: morning sunlight must actually flood the room, "
    "rain must actually be falling, a weekly lunch must actually be laid on the table. Keep every element the "
    "sentence names visible and recognisable, and add no people, animals, props, buildings, vehicles or weather the "
    "sentence does not imply. Never swap the sentence for a metaphor, a symbol, a mood board or a collage."
)

MODEL = "gpt-image-2.5-flare"
STATE = {"man": {}, "path": None, "dirty": 0, "force": False}
LOCK = threading.Lock()


def load_manifest(path):
    try:
        return json.loads(path.read_text())
    except Exception:
        return {}


def save_manifest(path, data):
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(data), encoding="utf-8")
    tmp.replace(path)  # atomic: a crash never leaves half a manifest


def entries():
    out = {}
    for p in sorted((FORGE / "text").glob("*.json")):
        try:
            for e in json.loads(p.read_text()):
                out[e["hid"]] = e
        except Exception:
            pass
    return out


def scene_of(e):
    """The everyday sentence is the scene; the hand-written hint is only a fallback."""
    for x in e.get("ex") or []:
        en = str(x.get("en", "")).strip()
        if len(en.split()) >= 5:
            return en
    scene = (e.get("scene") or "").strip()
    if len(scene.split()) >= 4:
        return scene
    return f'a typical everyday moment in which "{e.get("src", "")}" naturally appears'


def build_prompt(e):
    scene = scene_of(e)
    hint = (e.get("scene") or "").strip()
    if hint and len(hint.split()) >= 5 and hint.lower() not in scene.lower():
        scene = f"{scene} (visual hint: {hint})"
    return (
        f"SCENE — the picture must literally show this everyday moment, and nothing else:\n{scene}\n\n"
        f'Subject: the headword "{e.get("src", "")}" is what the picture is about. {BODY}\n\n'
        f"Art direction: {STYLE}"
    )


def digest_of(e):
    return hashlib.sha1(build_prompt(e).encode()).hexdigest()


def make(env, e, outdir, quality):
    out = outdir / f"{e['hid']}.webp"
    prompt = build_prompt(e)
    digest = hashlib.sha1(prompt.encode()).hexdigest()
    with LOCK:
        if out.exists() and not STATE["force"]:
            known = STATE["man"].get(str(e["hid"]))
            if known == digest:
                return "cached"
            if known is None:  # image from before the manifest: adopt it, do not rebuild the catalogue
                STATE["man"][str(e["hid"])] = digest
                STATE["dirty"] += 1
                return "cached"
    payload = {"model": MODEL, "prompt": prompt, "size": "1024x1024", "quality": quality, "n": 1}

    def call():
        raw = post_json(
            env["SUB2_BASE_URL"].rstrip("/") + "/images/generations",
            payload,
            {"Authorization": "Bearer " + env["SUB2_API_KEY"]},
            timeout=300,
        )
        d = json.loads(raw)
        b64 = d["data"][0].get("b64_json")
        if not b64:
            raise ValueError("no image")
        return base64.b64decode(b64)

    png = with_retry(call, tries=4, base=10)
    tmp = outdir / f"{e['hid']}.png"
    tmp.write_bytes(png)
    part = outdir / f"{e['hid']}.part.webp"
    subprocess.run(
        ["cwebp", "-quiet", "-q", "78", "-resize", "768", "768", "-m", "6", str(tmp), "-o", str(part)],
        check=True,
    )
    part.rename(out)  # atomic: readers never see a half-written file
    tmp.unlink()
    with LOCK:
        STATE["man"][str(e["hid"])] = digest
        STATE["dirty"] += 1
        if STATE["dirty"] >= 20:
            save_manifest(STATE["path"], STATE["man"])
            STATE["dirty"] = 0
    return "ok"


def preflight(env, dry_run):
    """Fail before spending money: missing entries, keys or cwebp all waste a paid API call."""
    if not entries():
        raise SystemExit("no entries: run scripts/atlas/gen_text.py first, it writes .local/forge/text/*.json")
    if dry_run:
        return
    missing = [k for k in ("SUB2_BASE_URL", "SUB2_API_KEY") if not env.get(k)]
    if missing:
        raise SystemExit(", ".join(missing) + " not set: put them in ~/.config/word-atlas/sub2.env (or export them)")
    if not shutil.which("cwebp"):
        raise SystemExit("cwebp not found: install WebP tools first, otherwise every generated png is thrown away")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--workers", type=int, default=6)
    ap.add_argument("--only", default="")
    ap.add_argument("--follow", action="store_true")
    ap.add_argument("--out", default="img")
    ap.add_argument("--shard", default="0/1", help="i/n: only handle hids where hid %% n == i")
    ap.add_argument("--quality", default="medium", choices=["low", "medium", "high", "auto"],
                    help="medium is the cost/faithfulness sweet spot (~$0.013 per image); "
                         "high costs 4x (~$0.053) for the entries you re-render")
    ap.add_argument("--force", action="store_true", help="re-render even when the cached image matches the prompt")
    ap.add_argument("--dry-run", action="store_true", help="print the prompt for each entry instead of calling the API")
    a = ap.parse_args()
    env = load_env()
    preflight(env, a.dry_run)
    outdir = FORGE / a.out
    outdir.mkdir(parents=True, exist_ok=True)
    STATE["path"] = outdir / ".manifest.json"
    STATE["man"] = load_manifest(STATE["path"])
    STATE["force"] = a.force
    only = {int(x) for x in a.only.split(",") if x}
    si, sn = (int(x) for x in a.shard.split("/"))
    submitted = set()
    stats = {"ok": 0, "fail": 0}
    lock = threading.Lock()

    inflight = [0]

    def fresh(e):
        """True when the picture on disk was made from the current prompt (or predates the manifest)."""
        if not (outdir / f"{e['hid']}.webp").exists():
            return False
        digest = digest_of(e)
        with LOCK:
            known = STATE["man"].get(str(e["hid"]))
            if known is None:  # adopt images generated before the manifest existed
                STATE["man"][str(e["hid"])] = digest
                STATE["dirty"] += 1
                return True
        return known == digest

    def run(e):
        if a.dry_run:
            print(f"\n=== {e['hid']} {e.get('w')} ===\n{build_prompt(e)}", flush=True)
            with lock:
                stats["ok"] += 1
            return
        try:
            make(env, e, outdir, a.quality)
            with lock:
                stats["ok"] += 1
        except Exception as ex:
            with lock:
                stats["fail"] += 1
            print("FAIL", e["hid"], e.get("w"), str(ex)[:200], flush=True)
        finally:
            with lock:
                inflight[0] -= 1

    try:
        with cf.ThreadPoolExecutor(a.workers) as pool:
            while True:
                es = entries()
                # Learning-path order: easier levels first, so early words are illustrated first.
                rank = {c: i for i, c in enumerate(["A1", "A2", "B1", "B2", "C1", "C2"])}
                path = sorted(es.values(), key=lambda e: (rank.get(e.get("cefr"), 3), hashlib.sha1(e["src"].encode()).hexdigest()))
                todo = [
                    e for e in path
                    if e["hid"] not in submitted and e["hid"] % sn == si and (not only or e["hid"] in only)
                    and (a.force or a.dry_run or not fresh(e))
                ]
                # Keep the queue short so newly generated easy words can jump ahead.
                room = max(0, a.workers * 2 - inflight[0])
                for e in todo[:room]:
                    submitted.add(e["hid"])
                    with lock:
                        inflight[0] += 1
                    pool.submit(run, e)
                if int(time.time()) % 60 < 5:
                    print(f"{time.strftime('%H:%M:%S')} todo={len(todo)} ok={stats['ok']} fail={stats['fail']}", flush=True)
                if not todo and inflight[0] == 0 and (not a.follow or len(es) >= 7298):
                    break
                time.sleep(5)
    finally:
        with LOCK:
            if STATE["dirty"]:
                save_manifest(STATE["path"], STATE["man"])
    print("finished", stats, flush=True)


if __name__ == "__main__":
    main()
