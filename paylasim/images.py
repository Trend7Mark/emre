"""Fotoğrafları platform kurallarına uygun hale getirme."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageOps

# Instagram: yalnızca JPEG; en-boy oranı 4:5 (0.8) ile 1.91:1 arasında olmalı.
IG_MIN_RATIO = 4 / 5
IG_MAX_RATIO = 1.91
IG_MAX_WIDTH = 1440
FB_MAX_SIDE = 2048
MAX_PHOTOS = 10


def _open_rgb(src: Path) -> Image.Image:
    img = Image.open(src)
    img = ImageOps.exif_transpose(img)  # telefon fotoğraflarının yönünü düzelt
    if img.mode in ("RGBA", "LA", "P"):
        img = img.convert("RGBA")
        bg = Image.new("RGB", img.size, (255, 255, 255))
        bg.paste(img, mask=img.split()[-1])
        return bg
    return img.convert("RGB")


def _shrink(img: Image.Image, max_w: int, max_h: int) -> Image.Image:
    if img.width <= max_w and img.height <= max_h:
        return img
    img = img.copy()
    img.thumbnail((max_w, max_h), Image.LANCZOS)
    return img


def needs_instagram_fit(width: int, height: int) -> bool:
    ratio = width / height
    return ratio < IG_MIN_RATIO - 0.001 or ratio > IG_MAX_RATIO + 0.001


def fit_ratio(img: Image.Image, color=(255, 255, 255)) -> Image.Image:
    """Oranı Instagram aralığına sokmak için kenarlara boşluk ekler (fotoğraf kırpılmaz)."""
    w, h = img.size
    ratio = w / h
    if ratio < IG_MIN_RATIO:  # çok dikey -> yanlara boşluk
        new_w, new_h = round(h * IG_MIN_RATIO), h
    elif ratio > IG_MAX_RATIO:  # çok yatay -> üst/alta boşluk
        new_w, new_h = w, round(w / IG_MAX_RATIO)
    else:
        return img
    canvas = Image.new("RGB", (new_w, new_h), color)
    canvas.paste(img, ((new_w - w) // 2, (new_h - h) // 2))
    return canvas


def prepare_facebook(src: Path, dest: Path) -> Path:
    img = _shrink(_open_rgb(src), FB_MAX_SIDE, FB_MAX_SIDE)
    img.save(dest, "JPEG", quality=92, optimize=True)
    return dest


def prepare_instagram(src: Path, dest: Path) -> Path:
    img = fit_ratio(_open_rgb(src))
    img = _shrink(img, IG_MAX_WIDTH, round(IG_MAX_WIDTH / IG_MIN_RATIO))
    img.save(dest, "JPEG", quality=92, optimize=True)
    return dest
