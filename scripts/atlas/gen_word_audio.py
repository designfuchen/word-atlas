"""Synthesize UK + US headword pronunciations with ElevenLabs (resumable).

Usage:
    python3 scripts/atlas/gen_word_audio.py [--workers 6] [--floor 30000]
    python3 scripts/atlas/gen_word_audio.py --pron [--force]

The first form voices the forge headwords into `.local/forge/audio/`.
`--pron` voices the two readings in `pron.json` straight into
`public/atlas/audio/{uk,us,uk2,us2}/`, which is what the share build ships.

A word on its own does not say which reading is wanted — `tear` is either /teə/
or /tɪə/ and the model picks one. `--pron` therefore sends a pronunciation
dictionary with an IPA rule per word, one dictionary per accent and reading.

Stops when remaining character credits drop below --floor.
"""
import argparse
import concurrent.futures as cf
import json
import threading
import time
import pathlib
import urllib.request

from ipa2arp import to_arpabet, to_arpabet_word
from common import FORGE, ROOT, load_env, with_retry

VOICES = {"uk": "Xb7hH8MSUJpSbSDYk0k2", "us": "EXAVITQu4vr4xnSDxMaL"}  # Alice, Sarah
MODEL = "eleven_v4_turbo"
PHONEME_MODEL = "eleven_turbo_v2"

PRON = pathlib.Path(__file__).resolve().parent / "pron.json"
WORD_AUDIO = ROOT / "public" / "atlas" / "audio"
API = "https://api.elevenlabs.io"


def api(key, method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        API + path, data=data, method=method, headers={"xi-api-key": key, "Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read() or b"{}")


def credits_left(key):
    req = urllib.request.Request("https://api.elevenlabs.io/v1/user/subscription", headers={"xi-api-key": key})
    d = json.loads(urllib.request.urlopen(req, timeout=30).read())
    return d["character_limit"] - d["character_count"]


def synth(key, voice, text, out, locator=None, prev=None, model=MODEL):
    payload = {"text": text, "model_id": model}
    if locator:
        payload["pronunciation_dictionary_locators"] = [locator]
    # Context decides the word class, and the word class decides the reading:
    # "They record" can only be the verb. The dictionary alone is a hint.
    if prev:
        payload["previous_text"] = prev
    req = urllib.request.Request(
        f"{API}/v1/text-to-speech/{voice}?output_format=mp3_44100_64",
        data=json.dumps(payload).encode(),
        headers={"xi-api-key": key, "Content-Type": "application/json"},
    )

    def call():
        with urllib.request.urlopen(req, timeout=60) as r:
            data = r.read()
        if len(data) < 2000:
            raise ValueError("audio too small")
        return data

    data = with_retry(call, tries=5, base=3)
    out.parent.mkdir(parents=True, exist_ok=True)
    tmp = out.with_suffix(".part")
    tmp.write_bytes(data)
    # `rename` refuses to clobber on Windows, which is exactly what --force needs.
    tmp.replace(out)


def dictionary(key, name, rules):
    """The dictionary with this name, creating it once if it is not there yet.

    The name carries a hash of the rules, so editing pron.json makes a new
    dictionary instead of silently reusing stale phonemes.
    """
    for d in api(key, "GET", "/v1/pronunciation-dictionaries")["pronunciation_dictionaries"]:
        if d["name"] == name:
            return {"pronunciation_dictionary_id": d["id"], "version_id": d["latest_version_id"]}
    made = api(key, "POST", "/v1/pronunciation-dictionaries/add-from-rules", {"name": name, "rules": rules})
    print(f"  dictionary {name} -> {made['id']}", flush=True)
    return {"pronunciation_dictionary_id": made["id"], "version_id": made["version_id"]}


def phoneme_rules(table, accent, group):
    return [
        {
            "type": "phoneme",
            "string_to_replace": word,
            "phoneme": spec["pron"][group][accent].strip("/"),
            "alphabet": "ipa",
            "case_sensitive": False,
            "word_boundaries": True,
        }
        for word, spec in table.items()
    ]


def rules_hash(rules):
    import hashlib

    return hashlib.sha1(json.dumps(rules, sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:8]


CUE = {"n.": "The", "v.": "They", "adj.": "It is", "adv.": "He spoke", "num.": "The", "det.": "The"}


def group_cues():
    """word -> {group: previous_text} using the part of speech of its senses."""
    out = {}
    for path in sorted((ROOT / "public" / "atlas" / "entries").glob("*.json")):
        for entry in json.loads(path.read_text(encoding="utf-8")):
            if not entry.get("pron"):
                continue
            cues = {}
            for sense in entry["senses"]:
                group = sense.get("v") or 0
                cue = CUE.get(sense["pos"])
                if cue and group not in cues:
                    cues[group] = cue
            out[entry["w"]] = cues
    return out


def pron_main(key, workers, force):
    table = json.loads(PRON.read_text(encoding="utf-8"))["words"]
    jobs = []
    for accent in ("uk", "us"):
        for group in (0, 1):
            folder = WORD_AUDIO / (accent if group == 0 else f"{accent}2")
            for word, spec in table.items():
                # A human recording from Commons is better than anything this
                # script can make; never overwrite one.
                if spec.get("voice") == "commons":
                    continue
                out = folder / f"{word}.mp3"
                if out.exists() and not force:
                    continue
                jobs.append((accent, group, word, out))
    total = len(table) * 4
    if not jobs:
        print(f"all {total} recordings already exist (use --force to redo them)")
        return 0
    print(f"{len(jobs)}/{total} recordings to make · {credits_left(key)} credits left")

    # One cheap call first: a blocked account fails here in a second instead of
    # after fifty retries. The error text is ElevenLabs' own.
    probe = WORD_AUDIO / ".probe.mp3"
    try:
        synth(key, VOICES["uk"], "a.", probe)
    except RuntimeError as e:
        print(f"\nElevenLabs refused the request:\n  {e}", flush=True)
        return 2
    finally:
        probe.unlink(missing_ok=True)

    cues = group_cues()
    batches = {}
    for job in jobs:
        batches.setdefault((job[0], job[1]), []).append(job)

    done = 0
    for (accent, group), batch in sorted(batches.items()):
        rules = phoneme_rules(table, accent, group)
        locator = dictionary(key, f"word-atlas-{accent}-{group}-{rules_hash(rules)}", rules)
        print(f"{accent}{'' if group == 0 else '2'}: {len(batch)} clips", flush=True)

        def work(job, locator=locator, accent=accent):
            _, group, word, out = job
            # `<phoneme>` beats the dictionary on the older models, and it wants
            # ARPAbet: the IPA in the table is converted first.
            ipa = table[word]["pron"][group][accent]
            # A hand-written ARPAbet wins: CMUdict does not cover every word.
            arp = (table[word].get("arp") or [None, None])[group] or to_arpabet_word(word, ipa)
            if arp:
                # Alice hums before a bare tag ("Emmm excess"); Sarah does not.
                # A synthetic take is already marked on the card, so both
                # accents use the voice that reads the tag cleanly.
                text = f'<phoneme alphabet="cmu-arpabet" ph="{arp}">{word}</phoneme>'
                synth(key, VOICES["us"], text, out, model=PHONEME_MODEL)
            else:
                synth(key, VOICES[accent], word + ".", out, locator, cues.get(word, {}).get(group))

        with cf.ThreadPoolExecutor(workers) as ex:
            for fut in cf.as_completed([ex.submit(work, j) for j in batch]):
                try:
                    fut.result()
                    done += 1
                except Exception as e:
                    print("FAIL", str(e)[:160], flush=True)

    print(f"finished {done}/{len(jobs)} · {credits_left(key)} credits left", flush=True)
    return 0 if done == len(jobs) else 1


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--workers", type=int, default=6)
    ap.add_argument("--floor", type=int, default=30000)
    ap.add_argument("--pron", action="store_true", help="voice the two readings in pron.json")
    ap.add_argument("--force", action="store_true", help="with --pron: redo recordings that already exist")
    a = ap.parse_args()
    key = load_env()["ELEVENLABS_API_KEY"]
    if a.pron:
        raise SystemExit(pron_main(key, a.workers, a.force))
    hw = json.loads((FORGE / "headwords.json").read_text())
    jobs = []
    for g in hw:
        for acc in ("uk", "us"):
            out = FORGE / "audio" / acc / f"{g['hid']}.mp3"
            if not out.exists():
                jobs.append((acc, g["word"], out))
    for acc in VOICES:
        (FORGE / "audio" / acc).mkdir(parents=True, exist_ok=True)
    print(f"jobs={len(jobs)} credits={credits_left(key)}", flush=True)
    stop = threading.Event()
    done = [0, 0]

    def work(job):
        if stop.is_set():
            return
        acc, word, out = job
        synth(key, VOICES[acc], word + ".", out)

    with cf.ThreadPoolExecutor(a.workers) as ex:
        futs = []
        for i, j in enumerate(jobs):
            futs.append(ex.submit(work, j))
        for f in cf.as_completed(futs):
            try:
                f.result()
                done[0] += 1
            except Exception as e:
                done[1] += 1
                print("FAIL", str(e)[:160], flush=True)
            if sum(done) % 200 == 0:
                left = credits_left(key)
                print(f"{time.strftime('%H:%M:%S')} done={done[0]} fail={done[1]} credits={left}", flush=True)
                if left < a.floor:
                    print("credit floor reached; stopping", flush=True)
                    stop.set()
    print("finished", done, flush=True)


if __name__ == "__main__":
    main()
