"""Generate resumable offline recordings with locally downloaded Kokoro v1.0.
Requires kokoro-onnx==0.6.1, soundfile, ffmpeg; models in .local/tts.
No network calls. Output follows the existing atlas audio directories.
"""
import argparse, concurrent.futures as cf, hashlib, json, shutil, subprocess, tempfile, time
from pathlib import Path
import numpy as np
import onnxruntime as ort
import soundfile as sf
import espeakng_loader
from kokoro_onnx import Kokoro
from kokoro_onnx.config import EspeakConfig

ROOT = Path(__file__).resolve().parents[1]
VOICES = {"uk": ("bf_emma", "en-gb"), "us": ("af_heart", "en-us"), "ex": ("bf_emma", "en-gb"), "ex2": ("bf_emma", "en-gb")}
BITS = {"uk": 2, "us": 4, "ex": 8, "ex2": 16}

def digest(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--workers", type=int, default=4)
    args = parser.parse_args()
    models = ROOT / ".local/tts"
    cache = models / "audio-cache"
    cache.mkdir(parents=True, exist_ok=True)
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg: raise RuntimeError("ffmpeg is required")
    data_path = ROOT / "public/atlas/supplemental.json"
    data = json.loads(data_path.read_text(encoding="utf-8"))
    model_hash = digest(models / "kokoro-v1.0.onnx")
    voices_hash = digest(models / "voices-v1.0.bin")
    # espeak's Windows C API needs an ASCII data path.
    phonemes = Path(tempfile.gettempdir()) / "word-atlas-tts/espeak-ng-data"
    shutil.copytree(espeakng_loader.get_data_path(), phonemes, dirs_exist_ok=True)
    options = ort.SessionOptions()
    options.intra_op_num_threads = 2
    options.inter_op_num_threads = 1
    session = ort.InferenceSession(str(models / "kokoro-v1.0.onnx"), sess_options=options, providers=["CPUExecutionProvider"])
    engine = Kokoro.from_session(session, str(models / "voices-v1.0.bin"), espeak_config=EspeakConfig(data_path=str(phonemes)))
    jobs, targets = {}, []
    for entry in data["entries"]:
        spoken = {"un": "U N", "C": "C", "x": "X"}.get(entry["w"], entry["w"]) + "."
        texts = {"uk": spoken, "us": spoken, **{("ex" if i == 0 else "ex2"): ex["en"] for i, ex in enumerate(entry["ex"])}}
        for kind, text in texts.items():
            voice, lang = VOICES[kind]
            key = hashlib.sha256(json.dumps([model_hash, voices_hash, voice, lang, text, 0.94, "mp3-96k"], ensure_ascii=False).encode()).hexdigest()
            jobs[key] = {"text": text, "voice": voice, "lang": lang}
            targets.append((entry["id"], kind, key))

    def generate(item):
        key, job = item
        mp3, meta = cache / (key + ".mp3"), cache / (key + ".json")
        if mp3.exists() and meta.exists():
            old = json.loads(meta.read_text(encoding="utf-8"))
            if all(old.get(field) == value for field, value in job.items()) and digest(mp3) == old["sha256"]:
                return key, old
        samples, rate = engine.create(job["text"], voice=job["voice"], speed=0.94, lang=job["lang"])
        samples = np.asarray(samples, dtype=np.float32)
        duration = len(samples) / rate
        peak = float(np.max(np.abs(samples)))
        rms = float(np.sqrt(np.mean(samples ** 2)))
        if not np.isfinite(samples).all() or duration < 0.15 or peak < 0.01 or rms < 0.001:
            raise ValueError(f"Invalid audio: {job} / duration={duration}, peak={peak}, rms={rms}")
        if peak > 0.98: samples *= 0.98 / peak
        wav = cache / (key + ".wav")
        sf.write(wav, samples, rate, subtype="PCM_16")
        partial = cache / (key + ".part.mp3")
        subprocess.run([ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav), "-codec:a", "libmp3lame", "-b:a", "96k", str(partial)], check=True)
        partial.replace(mp3)
        wav.unlink()
        result = {**job, "seconds": round(duration, 3), "peak": peak, "rms": rms, "sha256": digest(mp3)}
        meta.write_text(json.dumps(result, ensure_ascii=False), encoding="utf-8")
        return key, result

    print(f"Generating {len(jobs)} unique recordings for {len(targets)} files ({len(data['entries'])} cards).", flush=True)
    results = {}
    started = time.time()
    with cf.ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = [pool.submit(generate, job) for job in jobs.items()]
        for future in cf.as_completed(futures):
            key, result = future.result()
            results[key] = result
            if len(results) % 50 == 0 or len(results) == len(jobs):
                print(f"{len(results)}/{len(jobs)} completed; {time.time()-started:.0f}s elapsed", flush=True)
    assets = []
    by_id = {e["id"]: e for e in data["entries"]}
    for entry_id, kind, key in targets:
        target = ROOT / "public/atlas/audio" / kind / (entry_id + ".mp3")
        target.parent.mkdir(parents=True, exist_ok=True)
        if target.exists() and digest(target) != results[key]["sha256"]:
            raise RuntimeError(f"Refusing to replace a different recording: {target}")
        if not target.exists(): shutil.copyfile(cache / (key + ".mp3"), target)
        by_id[entry_id]["m"] |= BITS[kind]
        assets.append({"id": entry_id, "kind": kind, **results[key]})
    manifest = {"generator": "kokoro-onnx 0.6.1", "model": "Kokoro v1.0", "source": "https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.1", "modelLicense": "Apache-2.0", "modelSha256": model_hash, "voicesSha256": voices_hash, "speed": 0.94, "format": "MP3, 24 kHz mono, 96 kbps", "assets": assets}
    (ROOT / "data/supplemental-audio.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    data_path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Installed {len(assets)} recordings. Complete.", flush=True)

if __name__ == "__main__": main()
