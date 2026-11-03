"""Compile forge output into the public Word Atlas dataset.

Writes:
  public/atlas/index.json            compact list for search, grid and scheduling
  public/atlas/entries/<n>.json      full entries in chunks of 100 (learning order)
  public/atlas/img|thumb/<slug>.webp illustrations (512 / 256 px)
  public/atlas/audio/<uk|us|ex>/<slug>.mp3
  data/word-atlas.json|.csv          developer downloads (CC BY 4.0)
Usage: python3 scripts/atlas/build_atlas.py [--no-media]
"""
import argparse
import concurrent.futures as cf
import csv
import hashlib
import json
import re
import shutil
import subprocess

from common import FORGE, ROOT

TOPICS = [
    ("education", "教育"), ("work", "职场"), ("technology", "科技"), ("science", "科学"),
    ("environment", "环境"), ("health", "健康"), ("society", "社会"), ("government", "政法"),
    ("economy", "经济"), ("media", "媒体"), ("arts", "艺术"), ("travel", "旅行"),
    ("city", "城市"), ("nature", "自然"), ("daily", "生活"), ("emotion", "情感"),
    ("thinking", "思维"), ("sport", "运动"), ("history", "历史"),
]
TOPIC_INDEX = {k: i for i, (k, _) in enumerate(TOPICS)}
CEFR = ["A1", "A2", "B1", "B2", "C1", "C2"]
PUB = ROOT / "public" / "atlas"
DATA = ROOT / "data"


def slugify(word):
    s = word.strip().lower().replace("’", "'")
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "x"


def clean_entry(e):
    senses = [
        {"pos": (s.get("pos") or "").strip(), "zh": (s.get("zh") or "").strip(), "en": (s.get("en") or "").strip()}
        for s in (e.get("senses") or [])
        if s.get("zh")
    ][:3]
    ex = [
        {"en": (x.get("en") or "").strip(), "zh": (x.get("zh") or "").strip()}
        for x in (e.get("ex") or [])
        if x.get("en")
    ][:2]
    split = lambda xs: [x.strip() for x in (xs or []) if isinstance(x, str) and x.strip()]
    return {
        "w": (e.get("w") or e["src"]).strip(),
        "uk": (e.get("uk") or "").strip(),
        "us": (e.get("us") or "").strip(),
        "senses": senses,
        "ex": ex,
        "col": split(e.get("col"))[:4],
        "fam": split(e.get("fam"))[:4],
        "syn": split(e.get("syn"))[:3],
        "ant": split(e.get("ant"))[:2],
        "tip": (e.get("tip") or "").strip(),
        "cefr": e.get("cefr") if e.get("cefr") in CEFR else "B2",
        "topic": e.get("topic") if e.get("topic") in TOPIC_INDEX else "thinking",
        "note": (e.get("flag") or "").strip(),
    }


def webp(src, dst, size, q):
    if dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime:
        return
    subprocess.run(["cwebp", "-quiet", "-q", str(q), "-m", "6", "-resize", str(size), str(size), str(src), "-o", str(dst)], check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-media", action="store_true")
    a = ap.parse_args()

    raw = {}
    for p in sorted((FORGE / "text").glob("*.json")):
        for e in json.loads(p.read_text()):
            raw[e["hid"]] = e

    entries, warnings, seen = [], [], set()
    for hid, e in sorted(raw.items()):
        c = clean_entry(e)
        if not c["senses"] or len(c["ex"]) < 1:
            warnings.append({"hid": hid, "word": e.get("src"), "flag": "incomplete"})
            continue
        slug = slugify(e["src"])
        if slug in seen:
            slug = f"{slug}-{hid}"
        seen.add(slug)
        c["id"] = slug
        c["_hid"] = hid
        entries.append(c)

    # Learning path: easier levels first, deterministic shuffle inside each level
    # so neighbouring words come from different topics.
    entries.sort(key=lambda c: (CEFR.index(c["cefr"]), hashlib.sha1(c["id"].encode()).hexdigest()))

    for d in ("img", "thumb", "audio/uk", "audio/us", "audio/ex", "audio/ex2", "entries"):
        (PUB / d).mkdir(parents=True, exist_ok=True)

    def media(c):
        hid, slug, m = c["_hid"], c["id"], 0
        src = FORGE / "img" / f"{hid}.webp"
        if src.exists() and src.stat().st_size > 1000:
            try:
                if not a.no_media:
                    webp(src, PUB / "img" / f"{slug}.webp", 512, 74)
                    webp(src, PUB / "thumb" / f"{slug}.webp", 256, 70)
                m |= 1
            except subprocess.CalledProcessError:
                pass  # still being written; picked up on the next build
        for bit, acc, sub in ((2, "uk", "uk"), (4, "us", "us"), (8, "ex", "ex"), (16, "ex2", "ex2")):
            s = FORGE / "audio" / sub / f"{hid}.mp3"
            if s.exists():
                dst = PUB / "audio" / acc / f"{slug}.mp3"
                if not a.no_media and (not dst.exists() or dst.stat().st_size != s.stat().st_size):
                    shutil.copyfile(s, dst)
                m |= bit
        return m

    with cf.ThreadPoolExecutor(10) as ex:
        flags = list(ex.map(media, entries))

    index = []
    for i, (c, m) in enumerate(zip(entries, flags)):
        c["m"] = m
        s0 = c["senses"][0]
        zh = f'{s0["pos"]} {s0["zh"]}'.strip()
        # Senses after the first ride along so search can reach 缠绕 and 蜿蜒 on
        # the `wind` row, not just its first meaning. `|` never appears in a gloss.
        more = "|".join(f'{s["pos"]} {s["zh"]}'.strip() for s in c["senses"][1:])
        index.append([c["id"], c["w"], zh, c["uk"] or c["us"], CEFR.index(c["cefr"]), TOPIC_INDEX[c["topic"]], m, more])

    for n in range(0, len(entries), 100):
        chunk = [{k: v for k, v in c.items() if not k.startswith("_")} for c in entries[n : n + 100]]
        (PUB / "entries" / f"{n // 100}.json").write_text(json.dumps(chunk, ensure_ascii=False, separators=(",", ":")))

    meta = {
        "id": "word-atlas-open",
        "version": 1,
        "name": "Word Atlas Open",
        "license": "CC BY 4.0",
        "count": len(index),
        "examples": sum(len(c["ex"]) for c in entries),
        "illustrated": sum(1 for m in flags if m & 1),
        "voiced": sum(1 for m in flags if m & 2),
        "chunk": 100,
        "topics": TOPICS,
        "cefr": CEFR,
        "fields": ["id", "word", "zh", "ipa", "cefr", "topic", "media", "more"],
        "words": index,
    }
    (PUB / "index.json").write_text(json.dumps(meta, ensure_ascii=False, separators=(",", ":")))

    DATA.mkdir(exist_ok=True)
    public = [{k: v for k, v in c.items() if not k.startswith("_") and k != "m"} for c in entries]
    (DATA / "word-atlas.json").write_text(json.dumps(public, ensure_ascii=False, indent=1))
    with open(DATA / "word-atlas.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["id", "word", "ipa_uk", "ipa_us", "cefr", "topic", "meanings_zh", "definition_en",
                    "example1_en", "example1_zh", "example2_en", "example2_zh", "collocations", "word_family",
                    "synonyms", "antonyms", "tip_zh"])
        for c in public:
            ex = c["ex"] + [{"en": "", "zh": ""}] * (2 - len(c["ex"]))
            w.writerow([c["id"], c["w"], c["uk"], c["us"], c["cefr"], c["topic"],
                        " | ".join(f'{s["pos"]} {s["zh"]}' for s in c["senses"]),
                        " | ".join(s["en"] for s in c["senses"]),
                        ex[0]["en"], ex[0]["zh"], ex[1]["en"], ex[1]["zh"],
                        " ; ".join(c["col"]), " ; ".join(c["fam"]), ", ".join(c["syn"]), ", ".join(c["ant"]), c["tip"]])
    (FORGE / "build-warnings.json").write_text(json.dumps(warnings, ensure_ascii=False, indent=1))
    print(json.dumps({k: meta[k] for k in ("count", "examples", "illustrated", "voiced")}), "warnings", len(warnings))


if __name__ == "__main__":
    main()
