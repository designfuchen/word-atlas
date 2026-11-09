"""Run with: python3 -m unittest discover -s scripts -p 'test_package_public.py'."""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("package_public.py")


class PackagePublicTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="word-atlas-package-test-")
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name).resolve()
        self.project = self.base / "workspace" / "project"
        (self.project / "scripts").mkdir(parents=True)
        shutil.copyfile(SCRIPT, self.project / "scripts" / SCRIPT.name)
        (self.project / "README.md").write_text("Public fixture\n")
        (self.base / "keep.txt").write_text("ancestor data")
        (self.project.parent / "keep.txt").write_text("sibling data")

    def export(self, out):
        return subprocess.run(
            [sys.executable, str(self.project / "scripts" / SCRIPT.name), "--out", str(out)],
            capture_output=True,
            text=True,
        )

    def assert_refused(self, out):
        result = self.export(out)
        self.assertEqual(result.returncode, 2, result.stdout + result.stderr)
        self.assertIn("refusing", result.stdout)
        self.assertEqual((self.project / "README.md").read_text(), "Public fixture\n")
        self.assertEqual((self.base / "keep.txt").read_text(), "ancestor data")
        self.assertEqual((self.project.parent / "keep.txt").read_text(), "sibling data")

    def test_refuses_project(self):
        self.assert_refused(self.project)

    def test_refuses_descendant(self):
        self.assert_refused(self.project / "output")
        self.assertFalse((self.project / "output").exists())

    def test_refuses_parent_even_with_manifest(self):
        (self.project.parent / "PUBLIC_MANIFEST.json").write_text("{}")
        self.assert_refused(self.project.parent)

    def test_refuses_higher_ancestor(self):
        self.assert_refused(self.base)

    def test_refuses_symlink_to_ancestor(self):
        alias = self.base / "alias"
        alias.symlink_to(self.project.parent, target_is_directory=True)
        self.assert_refused(alias)
        self.assertTrue(alias.is_symlink())

    def test_refuses_unrelated_nonempty_directory(self):
        out = self.base / "unrelated"
        out.mkdir()
        (out / "keep.txt").write_text("unrelated data")
        self.assert_refused(out)
        self.assertEqual((out / "keep.txt").read_text(), "unrelated data")

    def test_refuses_directory_named_like_manifest(self):
        out = self.base / "unrelated"
        (out / "PUBLIC_MANIFEST.json").mkdir(parents=True)
        (out / "keep.txt").write_text("unrelated data")
        self.assert_refused(out)
        self.assertEqual((out / "keep.txt").read_text(), "unrelated data")

    def test_refuses_output_file(self):
        out = self.base / "file.txt"
        out.write_text("file data")
        self.assert_refused(out)
        self.assertEqual(out.read_text(), "file data")

    def assert_exported(self, out):
        result = self.export(out)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        manifest = json.loads((out / "PUBLIC_MANIFEST.json").read_text())
        self.assertIn("README.md", [item["path"] for item in manifest["items"]])
        self.assertEqual((out / "README.md").read_text(), "Public fixture\n")

    def test_exports_to_new_directory(self):
        self.assert_exported(self.base / "exports" / "new")

    def test_exports_to_empty_directory(self):
        out = self.base / "empty"
        out.mkdir()
        self.assert_exported(out)

    def test_reexports_previous_export_and_preserves_git(self):
        out = self.base / "previous"
        self.assert_exported(out)
        (out / "stale.txt").write_text("old export file")
        (out / ".git").mkdir()
        (out / ".git" / "keep.txt").write_text("git data")
        self.assert_exported(out)
        self.assertFalse((out / "stale.txt").exists())
        self.assertEqual((out / ".git" / "keep.txt").read_text(), "git data")


if __name__ == "__main__":
    unittest.main()
