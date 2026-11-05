"""Master the chosen sound kit into public/sfx/: trim, fade, loudness-match, seamless loops.

Usage: python3 scripts/atlas/build_sfx.py
"""
import subprocess

from common import FORGE, ROOT

# Chosen takes (by waveform/spectrogram review) -> published name.
UI = {
    "correct": "correct-0",
    "wrong": "wrong2-3",
    "flip": "flip-1",
    "page": "page-2",
    "complete": "complete-1",
    "streak": "streak-2",
    "start": "start-0",
    "tap": "tap-0",
    "key": "key-0",
}
AMBIENT = {
    "rain": "amb-rain-1",
    "sea": "amb-sea-0",
    "forest": "amb-forest-1",
    "fire": "amb-fire-1",
    "voyage": "amb-voyage-0",
    "cafe": "amb-cafe-1",
}
# Splash: voice line (Jason Chen, eleven_v3, verified by speech-to-text) and door/burst effects.
SPLASH = {"splash-voice": ("splash/voice-jason-0", -16), "splash-door": ("splash/door-0", -21), "splash-burst": ("splash/burst-2", -22)}
# Word galaxy: hover twinkle, camera flight, star ignition, two verified voice lines.
GALAXY = {
    "twinkle": ("galaxy/twinkle-0", -24),
    "fly": ("galaxy/fly-0", -22),
    "ignite": ("galaxy/ignite-1", -20),
    "voice-galaxy-hello": ("galaxy/galaxy-hello-0", -17),
    "voice-galaxy-lit": ("galaxy/galaxy-lit-0", -17),
}
MUSIC = {"amb-stars": "galaxy/music-galaxy-0"}
OUT = ROOT / "public" / "sfx"


def run(*args):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *args], check=True)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, src in UI.items():
        run(
            "-i", str(FORGE / "sfx" / f"{src}.mp3"),
            "-af",
            "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.01,"
            "areverse,silenceremove=start_periods=1:start_threshold=-60dB,areverse,"
            # Fade the *tail*: reverse, fade in the head, reverse back.
            # afade=t=out:st=0:d=0.001 muted everything after 1 ms, leaving
            # each UI cue as only ~10 ms of audio (see issue #48).
            "areverse,afade=t=in:st=0:d=0.01,areverse,"
            "loudnorm=I=-18:TP=-2:LRA=7,afade=t=in:d=0.004",
            "-ac", "1", "-ar", "44100", "-b:a", "96k", str(OUT / f"{name}.mp3"),
        )
    for name, src in AMBIENT.items():
        tmp = FORGE / "sfx" / f"_{name}.wav"
        # Body (3s..30s) crossfaded back into the head (0..3s): the end flows into the start.
        run(
            "-i", str(FORGE / "sfx" / f"{src}.mp3"),
            "-filter_complex",
            "[0:a]atrim=3:30,asetpts=PTS-STARTPTS[body];[0:a]atrim=0:3,asetpts=PTS-STARTPTS[head];"
            "[body][head]acrossfade=d=3:c1=qsin:c2=qsin,loudnorm=I=-26:TP=-6:LRA=8[out]",
            "-map", "[out]", "-ar", "44100", str(tmp),
        )
        run("-i", str(tmp), "-ac", "2", "-b:a", "112k", str(OUT / f"amb-{name}.mp3"))
        tmp.unlink()
    for name, (src, lufs) in SPLASH.items():
        run(
            "-i", str(FORGE / f"{src}.mp3"),
            "-af", f"silenceremove=start_periods=1:start_threshold=-50dB,loudnorm=I={lufs}:TP=-2,afade=t=in:d=0.005",
            "-ac", "1" if name == "splash-voice" else "2", "-b:a", "112k", str(OUT / f"{name}.mp3"),
        )
    for name, (src, lufs) in GALAXY.items():
        trim = ",atrim=0:0.4,afade=t=out:st=0.25:d=0.15" if name == "twinkle" else ""
        run(
            "-i", str(FORGE / f"{src}.mp3"),
            "-af", f"silenceremove=start_periods=1:start_threshold=-50dB{trim},loudnorm=I={lufs}:TP=-2,afade=t=in:d=0.005",
            "-ac", "1", "-b:a", "96k", str(OUT / f"{name}.mp3"),
        )
    for name, src in MUSIC.items():
        tmp = FORGE / "sfx" / f"_{name}.wav"
        run(
            "-i", str(FORGE / f"{src}.mp3"),
            "-filter_complex",
            "[0:a]atrim=4:120,asetpts=PTS-STARTPTS[body];[0:a]atrim=0:4,asetpts=PTS-STARTPTS[head];"
            "[body][head]acrossfade=d=4:c1=qsin:c2=qsin,loudnorm=I=-24:TP=-4:LRA=9[out]",
            "-map", "[out]", "-ar", "44100", str(tmp),
        )
        run("-i", str(tmp), "-ac", "2", "-b:a", "128k", str(OUT / f"{name}.mp3"))
        tmp.unlink()
    for f in sorted(OUT.glob("*.mp3")):
        print(f.name, f.stat().st_size)


if __name__ == "__main__":
    main()
