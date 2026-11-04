"""Read the etymology MDX directly from its record blocks.

The file is Encrypted="2": the key-block area is XORed with a passcode we do not
have, but the record blocks themselves are plain zlib streams. Every record is
one entry and starts with `<font size=3>headword</font>`, so the headword can be
taken from the HTML instead of from the (unreadable) key table.
"""
from __future__ import annotations

import re
import struct
import zlib
from pathlib import Path

HEAD = re.compile(r"<font size=3>(.*?)</font>", re.S)


class EtymMDX:
    def __init__(self, path: str | Path):
        self.path = Path(path)
        self.fp = open(self.path, "rb")
        self._header()
        self._locate_records()

    def _header(self) -> None:
        fp = self.fp
        size = struct.unpack(">I", fp.read(4))[0]
        self.header = fp.read(size).decode("utf-16le").strip("\x00 \t\r\n")
        fp.read(4)
        self.encrypt = 0
        for part in self.header.split():
            if part.startswith('Encrypted="'):
                self.encrypt = int(part.split('"')[1] or 0)

    def _locate_records(self) -> None:
        """Scan for the record-block header: (blocks, entries, blocks*16, bytes)."""
        fp = self.fp
        self.data_start = fp.tell()
        fp.read(8)  # num_key_blocks
        num_entries = struct.unpack(">Q", fp.read(8))[0]
        self.num_entries = num_entries
        fp.seek(self.data_start)
        head = fp.read(600_000)
        total = self.path.stat().st_size
        for off in range(0, len(head) - 32):
            n1, n2, n3, n4 = struct.unpack(">4Q", head[off:off + 32])
            if n2 != num_entries or n3 != n1 * 16 or not (0 < n4 <= total):
                continue
            if not (0 < n1 < 100_000):
                continue
            self.record_header = self.data_start + off
            self.num_record_blocks = n1
            self.record_info_size = n3
            self.record_bytes = n4
            return
        raise RuntimeError("record block header not found")

    def records(self):
        """Yield the decoded HTML of every record, in dictionary order."""
        fp = self.fp
        fp.seek(self.record_header)
        n1, n2, n3, n4 = struct.unpack(">4Q", fp.read(32))
        info = fp.read(n3)
        sizes = [struct.unpack(">Q", info[i * 16:i * 16 + 8])[0] for i in range(n1)]
        buf = bytearray()
        for size in sizes:
            buf += zlib.decompress(fp.read(size)[8:])
        text = bytes(buf).decode("utf-8", "replace")
        # Records are concatenated without separators; the headword banner is
        # the only marker that appears once per record.
        parts = HEAD.split(text)
        # parts = [preamble, w1, body1, w2, body2, ...]
        for i in range(1, len(parts) - 1, 2):
            yield parts[i].strip(), parts[i + 1]

    def close(self) -> None:
        self.fp.close()
