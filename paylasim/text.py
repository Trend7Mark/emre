"""Metin kuralları: X karakter sayımı ve X paylaşım penceresi adresi."""

from __future__ import annotations

import re
import unicodedata
from urllib.parse import urlencode

X_LIMIT = 280
X_URL_LENGTH = 23  # X her bağlantıyı 23 karakter sayar
IG_CAPTION_LIMIT = 2200
IG_HASHTAG_LIMIT = 30

URL_RE = re.compile(r"https?://\S+", re.IGNORECASE)
HASHTAG_RE = re.compile(r"#\w+", re.UNICODE)


def _x_char_weight(ch: str) -> int:
    # X'in kuralı: Latin/Türkçe harfler ve yaygın noktalama 1, diğerleri (emoji, CJK) 2.
    cp = ord(ch)
    if (
        cp <= 0x10FF
        or 0x2000 <= cp <= 0x200D
        or 0x2010 <= cp <= 0x201F
        or 0x2032 <= cp <= 0x2037
    ):
        return 1
    return 2


def x_length(text: str) -> int:
    # Emoji birleştiricileri ayrıca sayılmaz.
    text = unicodedata.normalize("NFC", text).replace("\ufe0f", "").replace("\u200d", "")
    total = 0
    pos = 0
    for m in URL_RE.finditer(text):
        total += sum(_x_char_weight(c) for c in text[pos : m.start()])
        total += X_URL_LENGTH
        pos = m.end()
    total += sum(_x_char_weight(c) for c in text[pos:])
    return total


def hashtag_count(text: str) -> int:
    return len(HASHTAG_RE.findall(text))


def x_intent_url(text: str) -> str:
    return "https://x.com/intent/post?" + urlencode({"text": text})
