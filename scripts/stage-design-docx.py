#!/usr/bin/env python3
"""Print an https URL for a local file that Google Drive can download.

Stdout is the URL and nothing else. The Project Manager passes that URL to
google_drive-update-file. The bytes at the URL match the local file.

The host keeps the file for about an hour. Do not print the URL in a reply.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import sys
import urllib.error
import urllib.request

UPLOAD_URL = "https://tmpfiles.org/api/v1/upload"
USER_AGENT = "Mozilla/5.0"
DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


class StageError(Exception):
    pass


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def request(url: str, data: bytes | None = None, headers: dict[str, str] | None = None) -> tuple[int, str, bytes]:
    req_headers = {"User-Agent": USER_AGENT}
    if headers:
        req_headers.update(headers)
    req = urllib.request.Request(url, data=data, headers=req_headers)
    try:
        with urllib.request.urlopen(req, timeout=120) as response:
            body = response.read()
            return response.status, response.headers.get("content-type", ""), body
    except urllib.error.HTTPError as error:
        body = error.read()
        return error.code, error.headers.get("content-type", ""), body
    except urllib.error.URLError as error:
        raise StageError(f"request failed: {error.reason}") from error


def upload(path: str) -> str:
    filename = os.path.basename(path)
    payload = open(path, "rb").read()
    boundary = "----stageDesignDocx"
    body = b"".join(
        [
            f"--{boundary}\r\n".encode(),
            (
                f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
                f"Content-Type: {DOCX_TYPE}\r\n\r\n"
            ).encode(),
            payload,
            f"\r\n--{boundary}--\r\n".encode(),
        ]
    )
    status, _content_type, raw = request(
        UPLOAD_URL,
        body,
        {"Content-Type": f"multipart/form-data; boundary={boundary}"},
    )
    if status != 200:
        raise StageError(f"upload failed with HTTP {status}")
    try:
        page = json.loads(raw.decode())["data"]["url"]
    except (json.JSONDecodeError, KeyError, TypeError):
        raise StageError("upload response had no page URL")
    if not isinstance(page, str) or not page.startswith("https://tmpfiles.org/"):
        raise StageError("upload response page URL was not usable")
    return page


def direct_url(page_url: str) -> str:
    status, _content_type, raw = request(page_url)
    if status != 200:
        raise StageError(f"download page failed with HTTP {status}")
    match = re.search(r"https://tmpfiles\.org/dl/[^\"'\s<]+", raw.decode("utf-8", "replace"))
    if not match:
        raise StageError("download page had no direct file link")
    return match.group(0).replace("&amp;", "&")


def assert_same_bytes(url: str, path: str) -> None:
    expected = open(path, "rb").read()
    status, content_type, actual = request(url)
    if status != 200:
        raise StageError(f"direct download failed with HTTP {status}")
    if "html" in content_type.lower() or not actual.startswith(b"PK"):
        raise StageError("direct download was not the docx")
    if hashlib.sha256(actual).digest() != hashlib.sha256(expected).digest():
        raise StageError("direct download did not match the local file")


def main() -> None:
    if len(sys.argv) != 2:
        fail("usage: python3 scripts/stage-design-docx.py path/to/file.docx")
    path = sys.argv[1]
    if not os.path.isfile(path):
        fail(f"file not found: {path}")
    last_error = "upload did not produce a matching download"
    for _attempt in range(3):
        try:
            url = direct_url(upload(path))
            assert_same_bytes(url, path)
            print(url)
            return
        except StageError as error:
            last_error = str(error)
    fail(last_error)


if __name__ == "__main__":
    main()
