#!/usr/bin/env python3
"""Export the public repository from a strict allowlist and scan every file.

    python3 scripts/package_public.py --out ../开源发布/word-atlas

Never reads .local/, environment files or credential stores, except that it may
compare file contents against secrets passed via ATLAS_SECRET_FILES so that an
exact leaked key is caught. Matched content is never printed.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOP = {
    "README.md", "README.en.md", "LICENSE", "CONTENT_LICENSE.md", "CONTRIBUTING.md", "SECURITY.md",
    ".gitignore", "package.json", "package-lock.json", "tsconfig.json", "vite.config.ts", "index.html",
}
SCRIPTS = {"check-atlas.mjs", "render-cards.mjs", "record-demo.mjs", "package_public.py", "test_package_public.py"}
ATLAS_SCRIPTS = {"common.py", "gen_text.py", "gen_images.py", "gen_brand.py", "gen_word_audio.py", "gen_sentence_audio.py", "gen_sfx.py", "gen_galaxy_audio.sh", "fix_blocked.py", "build_atlas.py", "build_sfx.py"}
TEXT = {".ts", ".tsx", ".css", ".svg", ".md", ".json", ".mjs", ".js", ".py", ".html", ".csv", ".yml", ".webmanifest", ""}
PATTERNS = {
    "API credential pattern": re.compile(rb"\b(?:sk[_-][A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{25,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[A-Z0-9]{16}|xi-[A-Za-z0-9]{20,})\b"),
    "private home path": re.compile(rb"(?:/Users/|/home/)[A-Za-z0-9_.-]+/|[A-Za-z]:\\Users\\"),
    "private key material": re.compile(rb"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    "credential in URL": re.compile(rb"https?://[^/\s:@]+:[^/\s@]{4,}@"),
    # Assembled at runtime so this file does not match its own pattern.
    "private dataset marker": re.compile("|".join(["private-ielts" + "-atlas", "/local" + "/media/", r"\.local" + "/media-map"]).encode()),
}


def allowed(rel: Path) -> bool:
    p = rel.parts
    name = rel.as_posix()
    if any(x in {".local", ".git", "node_modules", "dist", "output", "__pycache__", ".claude", ".playwright-cli"} or x.startswith(".env") for x in p):
        return False
    if len(p) == 1:
        return name in TOP
    if p[0] == "src":
        return rel.suffix in {".ts", ".tsx", ".css", ".svg"}
    if p[0] == "scripts":
        return (len(p) == 2 and p[1] in SCRIPTS) or (len(p) == 3 and p[1] == "atlas" and p[2] in ATLAS_SCRIPTS)
    if p[0] == "docs":
        return (len(p) == 2 and rel.suffix == ".md") or (len(p) == 3 and p[1] == "assets" and rel.suffix in {".jpg", ".png", ".gif", ".webp", ".mp4"})
    if p[0] == "data":
        return len(p) == 2 and p[1] in {"word-atlas.json", "word-atlas.csv", "README.md"}
    if name in {".github/workflows/check.yml", ".github/workflows/pages.yml"}:
        return True
    if p[0] == "public":
        inner = p[1:]
        if len(inner) == 1:
            return inner[0] in {"favicon.svg", "manifest.webmanifest", "icon-512.png", "robots.txt", "sw.js"}
        if inner[0] == "sfx":
            return len(inner) == 2 and rel.suffix == ".mp3"
        if inner[0] == "brand":
            return len(inner) == 2 and rel.suffix in {".webp", ".jpg"}
        if inner[0] == "atlas":
            sub = inner[1:]
            if sub == ("index.json",):
                return True
            if len(sub) == 2 and sub[0] == "entries":
                return re.fullmatch(r"\d+\.json", sub[1]) is not None
            if len(sub) == 2 and sub[0] in {"img", "thumb"}:
                return rel.suffix == ".webp"
            if len(sub) == 3 and sub[0] == "audio" and sub[1] in {"uk", "us", "ex", "ex2"}:
                return rel.suffix == ".mp3"
    return False


def secrets() -> list[bytes]:
    out = []
    for f in filter(None, os.environ.get("ATLAS_SECRET_FILES", "").split(os.pathsep)):
        for line in Path(f).read_text(errors="ignore").splitlines():
            v = line.split("=", 1)[-1].strip()
            if len(v) >= 16 and not v.startswith("http"):
                out.append(v.encode())
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    out = Path(a.out).resolve()
    if out == ROOT or ROOT in out.parents or out in ROOT.parents:
        print("refusing to export inside the project or to an ancestor of it")
        return 2
    if out.exists():
        if not out.is_dir():
            print("refusing to export to a non-directory")
            return 2
        if any(out.iterdir()) and not (out / "PUBLIC_MANIFEST.json").is_file():
            print("refusing to replace a non-empty directory without PUBLIC_MANIFEST.json")
            return 2
    keep_git = (out / ".git").exists()
    if out.exists():
        for child in out.iterdir():
            if child.name == ".git":
                continue
            shutil.rmtree(child) if child.is_dir() else child.unlink()
    out.mkdir(parents=True, exist_ok=True)
    exact = secrets()
    files, problems, total = [], [], 0
    for path in sorted(ROOT.rglob("*")):
        if path.is_symlink():
            continue
        rel = path.relative_to(ROOT)
        if not path.is_file() or not allowed(rel):
            continue
        data = path.read_bytes()
        if path.suffix in TEXT:
            hits = [label for label, rx in PATTERNS.items() if rx.search(data)]
            if any(s in data for s in exact):
                hits.append("exact secret match")
            if hits:
                problems.append(f"{rel}: {', '.join(hits)}")
                continue
        dst = out / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        dst.write_bytes(data)
        files.append({"path": rel.as_posix(), "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()})
        total += len(data)
    if problems:
        print("blocked files:\n  " + "\n  ".join(problems))
        return 1
    (out / "PUBLIC_MANIFEST.json").write_text(json.dumps({"files": len(files), "bytes": total, "items": files}, indent=0))
    print(json.dumps({"out": out.name, "files": len(files), "megabytes": round(total / 1e6, 1), "kept_git": keep_git}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
