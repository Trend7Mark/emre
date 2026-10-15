"""Tek tıkla paylaşım akışı: Facebook + Instagram otomatik, X yarı otomatik."""

from __future__ import annotations

from pathlib import Path

from . import images
from .config import Settings, get_token
from .graph import GraphClient, GraphError
from .text import IG_CAPTION_LIMIT, IG_HASHTAG_LIMIT, X_LIMIT, hashtag_count, x_intent_url, x_length

PLATFORMS = ("facebook", "instagram", "x")


def validate(text: str, x_text: str, platforms: set[str], photos: list[Path]) -> list[str]:
    """Paylaşımdan önce yakalanabilecek hataları döndürür (boşsa sorun yok)."""
    errors = []
    if not platforms:
        errors.append("En az bir platform seçin.")
    if not text.strip() and not photos:
        errors.append("Metin veya fotoğraf ekleyin.")
    if len(photos) > images.MAX_PHOTOS:
        errors.append(f"En fazla {images.MAX_PHOTOS} fotoğraf eklenebilir.")
    if "instagram" in platforms:
        if not photos:
            errors.append("Instagram paylaşımı için en az bir fotoğraf gerekli.")
        if len(text) > IG_CAPTION_LIMIT:
            errors.append(f"Instagram metni en fazla {IG_CAPTION_LIMIT} karakter olabilir.")
        if hashtag_count(text) > IG_HASHTAG_LIMIT:
            errors.append(f"Instagram'da en fazla {IG_HASHTAG_LIMIT} hashtag kullanılabilir.")
    if "x" in platforms and x_length(x_text) > X_LIMIT:
        errors.append(f"X metni {X_LIMIT} karakteri aşıyor ({x_length(x_text)}).")
    return errors


def publish(
    *,
    text: str,
    x_text: str,
    platforms: set[str],
    photos: list[Path],
    work_dir: Path,
    settings: Settings,
    client: GraphClient | None = None,
) -> dict:
    """Seçili platformlara paylaşır; her platformun sonucunu ayrı ayrı döndürür.

    Bir platformdaki hata diğerlerini durdurmaz.
    """
    results: dict[str, dict] = {}
    meta_targets = platforms & {"facebook", "instagram"}

    if meta_targets:
        token = get_token()
        if not settings.page_id or not token:
            for p in meta_targets:
                results[p] = {"ok": False, "error": "Facebook bağlantısı kurulmamış (Ayarlar)."}
        else:
            client = client or GraphClient()
            if "facebook" in platforms:
                results["facebook"] = _publish_facebook(client, settings, token, text, photos, work_dir)
            if "instagram" in platforms:
                if not settings.ig_user_id:
                    results["instagram"] = {
                        "ok": False,
                        "error": "Sayfaya bağlı Instagram İşletme hesabı bulunamadı.",
                    }
                else:
                    results["instagram"] = _publish_instagram(
                        client, settings, token, text, photos, work_dir
                    )

    if "x" in platforms:
        # X API ücretli olduğu için paylaşım penceresi metin hazır şekilde açılır;
        # fotoğraflar kullanıcı tarafından eklenir.
        results["x"] = {"ok": True, "manual": True, "url": x_intent_url(x_text)}

    return results


def _publish_facebook(client, settings, token, text, photos, work_dir) -> dict:
    try:
        photo_ids = []
        for i, src in enumerate(photos, 1):
            fb_img = images.prepare_facebook(src, work_dir / f"facebook_{i:02d}.jpg")
            photo_ids.append(client.upload_unpublished_photo(settings.page_id, token, fb_img))
        post_id = client.create_page_post(settings.page_id, token, text, photo_ids)
        return {"ok": True, "id": post_id, "url": client.post_permalink(post_id, token)}
    except (GraphError, OSError) as exc:
        return {"ok": False, "error": str(exc)}
    except Exception as exc:  # ağ hataları vb.
        return {"ok": False, "error": f"Beklenmeyen hata: {exc}"}


def _publish_instagram(client, settings, token, text, photos, work_dir) -> dict:
    try:
        # Instagram fotoğrafı bir internet adresinden çeker. Ayrı bir sunucu gerekmesin diye
        # fotoğraf önce Facebook Sayfasına "yayınlanmamış" olarak yüklenir ve Facebook'un
        # barındırdığı adres Instagram'a verilir.
        urls = []
        for i, src in enumerate(photos, 1):
            ig_img = images.prepare_instagram(src, work_dir / f"instagram_{i:02d}.jpg")
            photo_id = client.upload_unpublished_photo(settings.page_id, token, ig_img)
            urls.append(client.photo_source_url(photo_id, token))
        media_id = client.publish_instagram(settings.ig_user_id, token, text, urls)
        return {"ok": True, "id": media_id, "url": client.instagram_permalink(media_id, token)}
    except (GraphError, OSError) as exc:
        return {"ok": False, "error": str(exc)}
    except Exception as exc:
        return {"ok": False, "error": f"Beklenmeyen hata: {exc}"}
