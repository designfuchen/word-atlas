"""Write the second reading of a heteronym into the compiled atlas.

`pron.json` is the only place the 14 words, their IPA, the sense → reading map
and the OALDPEX file names are written down. This script copies the public half
of that into the dataset:

  public/atlas/entries/<n>.json   `pron`, `senses[].v`, single-valued uk/us
  public/atlas/index.json         the row's `ipa` becomes the first reading
  data/word-atlas.json|.csv       the same, for the downloadable dataset

The `src` file names stay behind — they are OALDPEX's, they belong to the
private build, and nothing in the public dataset needs them.

Idempotent: running it twice writes the same bytes. Run it after
`build_atlas.py`, which knows nothing about `pron` and would drop it.

Usage:
    python3 scripts/atlas/apply_pron.py --check   # report drift, write nothing
    python3 scripts/atlas/apply_pron.py
"""
from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PUB = ROOT / "public" / "atlas"
DATA = ROOT / "data"
TABLE = Path(__file__).resolve().parent / "pron.json"

COMPACT = {"ensure_ascii": False, "separators": (",", ":")}


def readings(word, spec):
    """The public shape of one word's groups: IPA only, no file names."""
    return [{"uk": g["uk"], "us": g["us"]} for g in spec["pron"]]


def apply_entry(entry, spec):
    """Mutate one entry in place; return a list of problems instead of raising."""
    problems = []
    groups = readings(entry["w"], spec)
    senses = spec["senses"]
    if len(entry["senses"]) != len(senses):
        problems.append(f"{entry['id']}: {len(entry['senses'])} senses, table has {len(senses)}")
        return problems
    if len(groups) < 2:
        problems.append(f"{entry['id']}: table lists {len(groups)} readings, expected 2+")
        return problems

    entry["pron"] = groups
    # `uk`/`us` stay as the first reading so every existing caller — the list,
    # the share card, the learning card's label — keeps working unchanged.
    entry["uk"] = groups[0]["uk"]
    entry["us"] = groups[0]["us"]
    # Keep `pron` beside the other pronunciation fields instead of at the end,
    # so a human reading data/word-atlas.json sees the readings together.
    pron = entry.pop("pron")
    ordered = {}
    for key, value in entry.items():
        ordered[key] = value
        if key == "us":
            ordered["pron"] = pron
    entry.clear()
    entry.update(ordered)
    for i, sense in enumerate(entry["senses"]):
        v = senses[i]
        if not 0 <= v < len(groups):
            problems.append(f"{entry['id']}: sense {i} points at reading {v}")
        elif v:
            sense["v"] = v
        else:
            sense.pop("v", None)
    return problems


def load_table():
    spec = json.loads(TABLE.read_text(encoding="utf-8"))
    if spec.get("version") != 1:
        raise SystemExit(f"{TABLE}: unsupported version {spec.get('version')!r}")
    return spec["words"]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="report what would change, write nothing")
    a = ap.parse_args()

    table = load_table()
    index_path = PUB / "index.json"
    index = json.loads(index_path.read_text(encoding="utf-8"))
    fields = index["fields"]
    id_at, ipa_at = fields.index("id"), fields.index("ipa")
    chunk_size = index["chunk"]

    by_id = {row[id_at]: i for i, row in enumerate(index["words"])}
    missing = [w for w in table if w not in by_id]
    if missing:
        raise SystemExit(f"not in index.json: {', '.join(sorted(missing))}")

    problems: list[str] = []
    changed_chunks: dict[int, list] = {}
    for word, spec in table.items():
        order = by_id[word]
        n = order // chunk_size
        if n not in changed_chunks:
            path = PUB / "entries" / f"{n}.json"
            changed_chunks[n] = [json.loads(path.read_text(encoding="utf-8")), path]
        chunk = changed_chunks[n][0]
        entry = chunk[order - n * chunk_size]
        if entry["id"] != word:
            problems.append(f"chunk {n} out of order at {word}: found {entry['id']}")
            continue
        problems += apply_entry(entry, spec)
        row = index["words"][order]
        first = entry["pron"][0]
        row[ipa_at] = first["uk"] or first["us"]

    # data/word-atlas.json — the developer download, one flat list.
    dev_path = DATA / "word-atlas.json"
    dev = json.loads(dev_path.read_text(encoding="utf-8"))
    dev_by_id = {e["id"]: e for e in dev}
    for word, spec in table.items():
        e = dev_by_id.get(word)
        if e is None:
            problems.append(f"data/word-atlas.json missing {word}")
            continue
        problems += apply_entry(e, spec)

    if problems:
        print("\n".join(problems), file=sys.stderr)
        return 1

    if a.check:
        drift = [
            path
            for chunk, path in changed_chunks.values()
            if path.read_text(encoding="utf-8") != json.dumps(chunk, **COMPACT)
        ]
        if index_path.read_text(encoding="utf-8") != json.dumps(index, **COMPACT):
            drift.append(index_path)
        if dev_path.read_text(encoding="utf-8") != json.dumps(dev, ensure_ascii=False, indent=1):
            drift.append(dev_path)
        if drift:
            print("dataset is out of date with pron.json:", file=sys.stderr)
            for p in drift:
                print(f"  {p.relative_to(ROOT)}", file=sys.stderr)
            print("  run: python3 scripts/atlas/apply_pron.py", file=sys.stderr)
            return 1
        print(f"pron table matches the dataset · {len(table)} words")
        return 0

    for chunk, path in changed_chunks.values():
        path.write_text(json.dumps(chunk, **COMPACT), encoding="utf-8")
    index_path.write_text(json.dumps(index, **COMPACT), encoding="utf-8")
    dev_path.write_text(json.dumps(dev, ensure_ascii=False, indent=1), encoding="utf-8")

    csv_path = DATA / "word-atlas.csv"
    if csv_path.exists():
        with csv_path.open(encoding="utf-8", newline="") as f:
            rows = list(csv.DictReader(f))
            header = rows[0].keys() if rows else []
        for row in rows:
            spec = table.get(row.get("id", ""))
            if spec:
                row["ipa_uk"] = spec["pron"][0]["uk"]
                row["ipa_us"] = spec["pron"][0]["us"]
        with csv_path.open("w", encoding="utf-8", newline="") as f:
            w = csv.DictWriter(f, fieldnames=list(header))
            w.writeheader()
            w.writerows(rows)

    total = sum(len(c) for c, _ in changed_chunks.values())
    print(f"applied {len(table)} words across {len(changed_chunks)} chunks ({total} entries in file)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
