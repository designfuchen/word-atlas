"""Import the etymology dictionary (etymology.mdx) into the word cards.

For every entry the dictionary carries eight 【…】 sections; the card only wants
three of them:

  【词源图景】  小结        → `ety`, the note under the IPA
  【近义词辨析】- word list  → appended to `syn`
  【同根词】    - word /ipa/ gloss → the `root` list

The MDX is Encrypted="2" but only its key table is locked; the record blocks are
plain zlib, so `mdx_records.py` decodes them and reads the headword from the
`<font size=3>` banner that opens each record.

Usage:
  python scripts/etymology/import_etymology.py --dump   # parse only, write JSON
  python scripts/etymology/import_etymology.py          # merge into atlas chunks
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from mdx_records import EtymMDX  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
MDX = ROOT / "etymology" / "etymology.mdx"
ENTRIES = ROOT / "public" / "atlas" / "entries"
DUMP = Path(__file__).resolve().parent / "etymology.json"

HEADING = re.compile(r"【([^】]{1,10})】")
TAG = re.compile(r"<[^>]+>")
ITEM = re.compile(r"^\s{2}- (.*)$")


def sections(body: str) -> dict[str, str]:
    """Split a record into 【heading】 → raw text, stopping at the trailing images."""
    body = body.split("<img", 1)[0]
    out: dict[str, str] = {}
    hits = list(HEADING.finditer(body))
    for i, hit in enumerate(hits):
        end = hits[i + 1].start() if i + 1 < len(hits) else len(body)
        out[hit.group(1)] = body[hit.end():end]
    return out


def unwrap(text: str) -> str:
    """Undo the dictionary's hard wrapping.

    Lines were broken by display width, so a break inside Chinese joins with
    nothing while a break between two Latin words keeps one space ("clove / of
    garlic"). Tags and blank lines go first.
    """
    text = TAG.sub("", text).replace("\r", "")
    out = ""
    for line in (l.strip() for l in text.split("\n")):
        if not line:
            continue
        if not out:
            out = line
        elif re.search(r"[A-Za-z0-9]$", out) and re.match(r"[A-Za-z0-9']", line):
            out += " " + line
        else:
            out += line
    return re.sub(r"\s{2,}", " ", out).strip()


def field(text: str, label: str) -> str:
    """The value of `词根：…` inside a section, wrapped lines included."""
    m = re.search(rf"{label}：(.+?)(?=\s*(?:词根|画面|小结|本词强调|概念|感觉|逻辑|概括|维度|含义|前缀|后缀|说明)：|$)", text, re.S)
    return unwrap(m.group(1)) if m else ""


def items(section: str) -> list[tuple[str, str]]:
    """`  - head` entries with the lines that follow them."""
    out: list[tuple[str, str]] = []
    for line in section.replace("\r", "").split("\n"):
        m = ITEM.match(line)
        if m:
            out.append((m.group(1).strip(), ""))
        elif out and line.strip() and not line.strip().startswith("<"):
            head, tail = out[-1]
            out[-1] = (head, (tail + " " + line.strip()).strip())
    return out


def head_word(raw: str) -> str:
    """The headword of a bullet — `1. resist`, `- an  /ən/  art.…` → `resist`, `an`."""
    word = re.sub(r"^\d+[.、)]\s*", "", raw.strip())
    word = re.split(r"\s{2,}|\s+/", word)[0]
    return word.strip(" .。:：-")


def parse_syn(section: str, head: str) -> list[str]:
    words = []
    for raw, _ in items(section):
        word = re.sub(r"\s*\(.*?\)\s*$", "", head_word(raw))
        if not word or word.lower() == head.lower():
            continue
        if not re.fullmatch(r"[A-Za-z][A-Za-z' -]{0,30}", word):
            continue
        if word.lower() not in (w.lower() for w in words):
            words.append(word)
    return words


def parse_root(section: str, head: str) -> list[str]:
    """Just the headwords: the gloss is a tap away in the lookup card."""
    out = []
    for raw, _ in items(section):
        word = head_word(raw)
        if not re.fullmatch(r"[A-Za-z][A-Za-z' -]{0,30}", word) or word.lower() == head.lower():
            continue
        if word.lower() not in (w.lower() for w in out):
            out.append(word)
    return out


def parse(word: str, body: str) -> dict | None:
    sec = sections(body)
    scene = sec.get("词源图景", "")
    root = field(scene, "词根")
    summary = field(scene, "小结")
    if not summary:
        return None
    return {
        "r": root,
        "s": summary,
        "syn": parse_syn(sec.get("近义词辨析", ""), word),
        "root": parse_root(sec.get("同根词", ""), word),
    }


def dedupe(words: list[str], head: str) -> list[str]:
    """Case-insensitive unique, and never the headword itself."""
    out: list[str] = []
    seen = {head.lower()}
    for w in words:
        w = w.strip()
        if w and w.lower() not in seen:
            seen.add(w.lower())
            out.append(w)
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dump", action="store_true", help="only write the parsed JSON")
    ap.add_argument("--limit", type=int, default=0)
    a = ap.parse_args()

    mdx = EtymMDX(MDX)
    words: dict[str, dict] = {}
    for word, body in mdx.records():
        data = parse(word, body)
        if data:
            words[word.lower()] = data

    DUMP.write_text(json.dumps({"v": 1, "source": "词源词典 etymology.mdx", "words": words},
                               ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"parsed {len(words)} entries · {DUMP.stat().st_size / 1024:.0f} KB")
    if a.dump:
        return

    # Merge into the shipped chunks, which the card already loads one at a time.
    total = hit = 0
    syn_added = root_added = 0
    for path in sorted(ENTRIES.glob("*.json")):
        chunk = json.loads(path.read_text(encoding="utf-8"))
        changed = False
        for e in chunk:
            total += 1
            syn = dedupe(e.get("syn", []), e["w"])
            if syn != e.get("syn", []):
                e["syn"] = syn
                changed = True
            if "root" in e:
                root = dedupe(e["root"], e["w"])
                if root:
                    e["root"] = root
                else:
                    del e["root"]
                    changed = True
            data = words.get(e["w"].lower())
            if not data:
                continue
            hit += 1
            changed = True
            e["ety"] = data["s"]
            if data["syn"]:
                have = {s.lower() for s in e.get("syn", [])}
                extra = [s for s in data["syn"] if s.lower() not in have][:4]
                if extra:
                    e["syn"] = (extra + e.get("syn", []))[:6]
                    syn_added += len(extra)
            if data["root"]:
                # 词族 already lists the inflections ("librarian (n.)"), and a
                # synonym is rarely worth repeating as a cognate too.
                skip = {re.sub(r"\s*\(.*\)\s*$", "", f).strip().lower() for f in e.get("fam", [])}
                skip |= {s.lower() for s in e.get("syn", [])}
                roots = [w for w in data["root"] if w.lower() not in skip][:6]
                if roots:
                    e["root"] = roots
                    root_added += len(roots)
        if changed:
            path.write_text(json.dumps(chunk, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"merged into {hit}/{total} entries · +{syn_added} synonyms · {root_added} same-root links")


if __name__ == "__main__":
    main()
