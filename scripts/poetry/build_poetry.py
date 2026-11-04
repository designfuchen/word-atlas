"""Build the Word Atlas poetry dataset from chinese-poetry (MIT).

Sources, relative to a checkout of https://github.com/chinese-poetry/chinese-poetry:
  水墨唐诗/shuimotangshi.json   simplified, carries a plain-language gist (prologue), used only with --with-gist
  全唐诗/唐诗三百首.json         traditional, carries tags (form and theme)

Output: data/poetry.json, public/poetry/index.json and public/poetry/poems/<n>.json.
Needs: pip install pypinyin opencc-python-reimplemented
Usage: python3 scripts/poetry/build_poetry.py --src ../chinese-poetry
"""
import argparse
import json
import pathlib
import re
import sys

from opencc import OpenCC
from pypinyin import Style, lazy_pinyin, pinyin

ROOT = pathlib.Path(__file__).resolve().parents[2]
CHUNK = 50
DYNASTY = "唐"
FORMS = ["五言绝句", "七言绝句", "五言律诗", "七言律诗", "五言古诗", "七言古诗", "乐府", "其他"]
FORM_LEVEL = {"五言绝句": 0, "七言绝句": 1, "五言律诗": 1, "七言律诗": 2, "五言古诗": 2, "七言古诗": 3, "乐府": 3, "其他": 3}
LEVELS = ["入门", "初级", "中级", "进阶"]
HAN = re.compile(r"[㐀-鿿]")
SENTENCE = re.compile(r"[^，。？！；]+[，。？！；]?")

# Readings that general-purpose pinyin tools get wrong in classical poems.
# (line fragment, character, reading): applied to the first character in the fragment equal to `character`.
# Keep this list to readings that textbooks agree on; the review report lists the rest.
READING_FIXES = [
    ("鬓毛衰", "衰", "cuī"),
    ("一骑红尘", "骑", "jì"),
    ("少小离家", "少", "shào"),
]

# The source text has typos (checked against the well-known versions). Applied to poem lines and gist.
# Add a row only when the correct reading is certain.
TEXT_FIXES = [
    ("远目寒山石径斜", "远上寒山石径斜"),
    ("经豆", "红豆"),
    ("多彩撷", "多采撷"),
]
# Tags that describe the era or the collection, not a theme.
NOT_THEMES = {"唐诗三百首", "隋・唐・五代", "唐", "唐代", "地名", "带有地名"}
# Textbook grade tags (三年级上册, 七年级上册(课内) ...) are dropped; the school stage tags
# 小学古诗 / 初中古诗 / 高中古诗 stay as themes and the app shows them as a separate filter.
GRADE_TAG = re.compile(r"[一二三四五六七八九]年级|册")

t2s = OpenCC("t2s").convert


def pinyin_line(line):
    """One reading per character; punctuation and other non-Han characters get an empty string."""
    out = []
    for ch, py in zip(line, pinyin(line, style=Style.TONE, errors=lambda s: [""] * len(s), heteronym=False)):
        out.append(py[0] if HAN.match(ch) else "")
    for frag, ch, reading in READING_FIXES:
        at = line.find(frag)
        if at >= 0:
            out[at + frag.index(ch)] = reading
    return out


def slug(title, author):
    s = "-".join(lazy_pinyin(title + author, style=Style.NORMAL, errors=lambda x: [""] * len(x)))
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9-]", "", s.lower())).strip("-")[:56] or "poem"


def form_of(tags):
    for t in tags:
        t = t2s(t)
        if t in FORMS:
            return t
        if t.endswith("七言律诗") or t.endswith("七律"):
            return "七言律诗"
    return None


def themes_of(tags):
    tags = [t2s(t) for t in tags]
    keep = [t for t in dict.fromkeys(tags) if t not in NOT_THEMES and t not in FORMS and not GRADE_TAG.search(t)]
    # 咏物 / 咏物诗 and 秋 / 秋天 name the same theme: keep the shorter one.
    return [t for t in keep if not (t[-1] in "诗天" and t[:-1] in keep)]


def infer_form(lines):
    n = len(lines)
    chars = {len(re.sub(r"[^㐀-鿿]", "", l)) for l in lines}
    seven = chars == {7}
    five = chars == {5}
    if n == 4 and five:
        return "五言绝句"
    if n == 4 and seven:
        return "七言绝句"
    if n == 8 and five:
        return "五言律诗"
    if n == 8 and seven:
        return "七言律诗"
    return "其他"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True, help="path to a chinese-poetry checkout")
    ap.add_argument("--with-gist", action="store_true", help="keep the upstream plain-language summaries (prologue); their license is not stated, so they are left out by default")
    args = ap.parse_args()
    src = pathlib.Path(args.src)

    mo = json.loads((src / "水墨唐诗/shuimotangshi.json").read_text(encoding="utf-8"))
    sb = json.loads((src / "全唐诗/唐诗三百首.json").read_text(encoding="utf-8"))
    tags = {(t2s(p["title"]), t2s(p["author"])): p.get("tags", []) for p in sb}

    poems, seen, matched = [], {}, 0
    for p in mo:
        title, author = p["title"].strip(), p["author"].strip()
        # Source paragraphs hold one couplet each, but a few poems are a single paragraph;
        # normalise to one sentence per line so couplets can be rebuilt as pairs.
        text, gist = "".join(p["paragraphs"]), (p.get("prologue") or "").strip()
        for bad, good in TEXT_FIXES:
            text, gist = text.replace(bad, good), gist.replace(bad, good)
        lines = [l.strip() for l in SENTENCE.findall(text) if l.strip()]
        if not title or len(lines) < 2:
            print(f"skip {title!r}: too short", file=sys.stderr)
            continue
        tg = tags.get((title, author), [])
        matched += bool(tg)
        form = form_of(tg) or infer_form(lines)
        sid = slug(title, author)
        seen[sid] = seen.get(sid, 0) + 1
        if seen[sid] > 1:
            sid = f"{sid}-{seen[sid]}"
        poems.append(
            {
                "id": sid,
                "title": title,
                "author": author,
                "dynasty": DYNASTY,
                "form": form,
                "themes": themes_of(tg),
                "level": FORM_LEVEL[form],
                "lines": [{"zh": l, "py": pinyin_line(l)} for l in lines],
                "gist": gist if args.with_gist else "",
            }
        )

    # Learning path: easier forms first, shorter poems first within a level.
    size = lambda x: sum(len(l["zh"]) for l in x["lines"])
    poems.sort(key=lambda x: (x["level"], size(x), x["id"]))

    theme_list = sorted({t for p in poems for t in p["themes"]})
    index = {
        "id": "poetry-tang",
        "name": "唐诗",
        "count": len(poems),
        "chunk": CHUNK,
        "forms": FORMS,
        "levels": LEVELS,
        "themes": theme_list,
        "poems": [
            [p["id"], p["title"], p["author"], FORMS.index(p["form"]), p["level"], len(p["lines"]), [theme_list.index(t) for t in p["themes"]], p["lines"][0]["zh"].rstrip("，。？！；")]
            for p in poems
        ],
    }

    pub = ROOT / "public/poetry"
    (pub / "poems").mkdir(parents=True, exist_ok=True)
    for old in (pub / "poems").glob("*.json"):
        old.unlink()
    dump = lambda o: json.dumps(o, ensure_ascii=False, separators=(",", ":"))
    (pub / "index.json").write_text(dump(index), encoding="utf-8")
    for n in range(0, len(poems), CHUNK):
        (pub / "poems" / f"{n // CHUNK}.json").write_text(dump(poems[n : n + CHUNK]), encoding="utf-8")
    (ROOT / "data/poetry.json").write_text(json.dumps(poems, ensure_ascii=False, indent=1), encoding="utf-8")

    # Review report: characters with more than one common reading, per poem line.
    poly = sum(1 for p in poems for l in p["lines"] for ch in l["zh"] if HAN.match(ch) and len(pinyin(ch, heteronym=True)[0]) > 1)
    print(f"poems {len(poems)}, with tags {matched}, forms { {f: sum(p['form'] == f for p in poems) for f in FORMS} }")
    print(f"characters with several readings (review candidates): {poly}")


if __name__ == "__main__":
    main()
