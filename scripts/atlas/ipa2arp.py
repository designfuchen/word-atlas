"""IPA to CMU ARPAbet, stress marks included.

The `<phoneme>` tag only works on the older models, and those take ARPAbet
rather than IPA. Our readings are IPA, so they are converted here: consonants
first (longest first, so tʃ does not split), then vowels, carrying ˈ as 1 and
ˌ as 2. A full vowel left at 0 would read as reduced, so it becomes 2, which
is what CMU does.
"""
import pathlib
import re

CONS = [
    ("tʃ", "CH"), ("dʒ", "JH"), ("θ", "TH"), ("ð", "DH"), ("ʃ", "SH"), ("ʒ", "ZH"),
    ("ŋ", "NG"), ("p", "P"), ("b", "B"), ("t", "T"), ("d", "D"), ("k", "K"), ("g", "G"), ("ɡ", "G"),
    ("f", "F"), ("v", "V"), ("s", "S"), ("z", "Z"), ("h", "HH"), ("m", "M"), ("n", "N"),
    ("l", "L"), ("r", "R"), ("j", "Y"), ("w", "W"),
]
VOW = [
    ("ɜːr", ["ER"]), ("ər", ["ER"]), ("ɑːr", ["AA", "R"]), ("ɔːr", ["AO", "R"]),
    ("ɪə", ["IH", "R"]), ("eə", ["EH", "R"]), ("ʊə", ["UH", "R"]),
    ("iː", ["IY"]), ("uː", ["UW"]), ("ɑː", ["AA"]), ("ɔː", ["AO"]), ("ɜː", ["ER"]),
    ("eɪ", ["EY"]), ("aɪ", ["AY"]), ("ɔɪ", ["OY"]), ("aʊ", ["AW"]), ("əʊ", ["OW"]),
    ("oʊ", ["OW"]), ("ɪ", ["IH"]), ("e", ["EH"]), ("æ", ["AE"]), ("ɒ", ["AA"]),
    ("ʊ", ["UH"]), ("ʌ", ["AH"]), ("ə", ["AH"]), ("ɝ", ["ER"]), ("ɚ", ["ER"]),
    ("ɑ", ["AA"]), ("ɔ", ["AO"]), ("i", ["IY"]), ("u", ["UW"]),
]

def to_arpabet(ipa):
    s = ipa.strip("/").replace("(r)", "").replace(" ", "").replace("-", "").replace("\u2011", "")
    out, stress, i = [], None, 0
    while i < len(s):
        ch = s[i]
        if ch in "ˈˌ":
            stress = 1 if ch == "ˈ" else 2
            i += 1
            continue
        if ch == ".":
            i += 1
            continue
        for src, sym in CONS:
            if s.startswith(src, i):
                out.append([sym, None]); i += len(src); break
        else:
            for src, syms in VOW:
                if s.startswith(src, i):
                    out.append([syms[0], stress if stress is not None else 0])
                    for extra in syms[1:]:
                        out.append([extra, None])
                    stress = None
                    i += len(src)
                    break
            else:
                return None
    if not out:
        return None
    # a word with no mark anywhere still needs one primary stress
    if not any(x[1] == 1 for x in out):
        for item in out:
            if item[1] == 0:
                item[1] = 1
                break
    # Nothing is promoted here. An unstressed vowel stays at 0 even when it is
    # full — promoting it gave `prostrate` two stresses and flattened `minute`.
    # The IPA already says where the stress is.
    return " ".join(sym if st is None else f"{sym}{st}" for sym, st in out)


_CMU = None


def _cmudict():
    global _CMU
    if _CMU is None:
        path = pathlib.Path(__file__).with_name("cmudict.dict")
        table = {}
        if path.exists():
            for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
                line = line.split("#")[0].strip()
                if not line:
                    continue
                head, *phones = line.split()
                word = re.sub(r"\(\d+\)$", "", head)
                table.setdefault(word, []).append(phones)
        _CMU = table
    return _CMU


def _primary_index(phones):
    """Which vowel carries the 1, counted in vowels."""
    n = 0
    for ph in phones:
        if ph[-1:].isdigit():
            if ph[-1] == "1":
                return n
            n += 1
    return None


def to_arpabet_word(word, ipa):
    """ARPAbet for one word, preferring the CMU entry that matches our stress.

    The converter alone leaves unstressed full vowels at 0, which the model
    reduces ("AD-upt" for adept). CMUdict knows where the secondary stress
    belongs, so when it has an entry with the same primary stress position we
    take its stress pattern; otherwise the converted string is used as is.
    """
    ours = to_arpabet(ipa)
    if not ours:
        return None
    base = [p.rstrip("012") for p in ours.split()]
    idx = _primary_index(ours.split())
    variants = _cmudict().get(word.lower().replace("-", ""), [])
    same = [v for v in variants if _primary_index(v) == idx]
    if not same:
        return ours
    best = min(same, key=lambda v: abs(len(v) - len(base)))
    if len(best) == len(base):
        # Keep our phonemes, take CMU's stress digits. Consonants carry none.
        return " ".join(sym + (st[-1] if st[-1].isdigit() else "") for sym, st in zip(base, best))
    return " ".join(best)
