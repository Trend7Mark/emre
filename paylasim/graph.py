"""Meta Graph API (Facebook Sayfası + Instagram İşletme hesabı) istemcisi."""

from __future__ import annotations

import time
from dataclasses import dataclass
from pathlib import Path

import requests

from .config import GRAPH_API_VERSION

GRAPH_URL = f"https://graph.facebook.com/{GRAPH_API_VERSION}"
TIMEOUT = 120


class GraphError(Exception):
    """Graph API'nin döndürdüğü hatayı Türkçe/okunur biçimde taşır."""


# Sık görülen hata kodları için kullanıcıya ne yapacağını söyleyen açıklamalar.
ERROR_HINTS = {
    190: "Erişim anahtarı geçersiz veya süresi dolmuş. Ayarlar sekmesinden yeniden bağlanın.",
    10: "Uygulamanın bu işlem için izni yok. Erişim anahtarını gerekli izinlerle yeniden oluşturun.",
    200: "Uygulamanın bu işlem için izni yok. Erişim anahtarını gerekli izinlerle yeniden oluşturun.",
    4: "Kısa sürede çok fazla istek gönderildi. Birkaç dakika sonra tekrar deneyin.",
    9004: "Instagram fotoğrafı indiremedi. Birkaç dakika sonra tekrar deneyin.",
}


def _check(resp: requests.Response) -> dict:
    try:
        data = resp.json()
    except ValueError:
        resp.raise_for_status()
        raise GraphError(f"Beklenmeyen yanıt: {resp.text[:200]}")
    if isinstance(data, dict) and "error" in data:
        err = data["error"]
        msg = err.get("error_user_msg") or err.get("message") or "Bilinmeyen hata"
        code = err.get("code")
        if code is not None:
            msg = f"{msg} (kod {code})"
            if code in ERROR_HINTS:
                msg = f"{ERROR_HINTS[code]} [{msg}]"
        raise GraphError(msg)
    resp.raise_for_status()
    return data


@dataclass
class PageInfo:
    id: str
    name: str
    access_token: str
    ig_user_id: str = ""
    ig_username: str = ""


class GraphClient:
    def __init__(self, session: requests.Session | None = None, poll_interval: float = 2.0):
        self.http = session or requests.Session()
        self.poll_interval = poll_interval

    def _get(self, path: str, **params) -> dict:
        return _check(self.http.get(f"{GRAPH_URL}/{path}", params=params, timeout=TIMEOUT))

    def _post(self, path: str, data: dict, files: dict | None = None) -> dict:
        return _check(
            self.http.post(f"{GRAPH_URL}/{path}", data=data, files=files, timeout=TIMEOUT)
        )

    # --- Bağlantı kurulumu ------------------------------------------------------

    def exchange_long_lived_user_token(self, app_id: str, app_secret: str, short_token: str) -> str:
        data = self._get(
            "oauth/access_token",
            grant_type="fb_exchange_token",
            client_id=app_id,
            client_secret=app_secret,
            fb_exchange_token=short_token,
        )
        return data["access_token"]

    def list_pages(self, user_token: str) -> list[PageInfo]:
        """Kullanıcının yönettiği sayfaları ve bağlı Instagram hesaplarını listeler.

        Uzun ömürlü kullanıcı token'ı ile alınan sayfa token'larının süresi dolmaz.
        """
        data = self._get(
            "me/accounts",
            fields="id,name,access_token,instagram_business_account{id,username}",
            limit=100,
            access_token=user_token,
        )
        pages = []
        for item in data.get("data", []):
            ig = item.get("instagram_business_account") or {}
            pages.append(
                PageInfo(
                    id=item["id"],
                    name=item.get("name", ""),
                    access_token=item["access_token"],
                    ig_user_id=ig.get("id", ""),
                    ig_username=ig.get("username", ""),
                )
            )
        return pages

    def check_page_token(self, page_id: str, token: str) -> str:
        return self._get(page_id, fields="name", access_token=token).get("name", "")

    # --- Facebook ---------------------------------------------------------------

    def upload_unpublished_photo(self, page_id: str, token: str, image: Path) -> str:
        """Fotoğrafı sayfaya yayınlamadan yükler; döndürülen kimlik gönderiye eklenir."""
        with image.open("rb") as fh:
            data = self._post(
                f"{page_id}/photos",
                data={"published": "false", "access_token": token},
                files={"source": (image.name, fh, "image/jpeg")},
            )
        return data["id"]

    def photo_source_url(self, photo_id: str, token: str) -> str:
        """Facebook'un fotoğrafı barındırdığı herkese açık adres (Instagram buradan çeker)."""
        data = self._get(photo_id, fields="images", access_token=token)
        images = data.get("images") or []
        if not images:
            raise GraphError("Facebook fotoğraf adresi alınamadı.")
        largest = max(images, key=lambda i: i.get("width", 0) * i.get("height", 0))
        return largest["source"]

    def create_page_post(self, page_id: str, token: str, message: str, photo_ids: list[str]) -> str:
        data = {"message": message, "access_token": token}
        for i, pid in enumerate(photo_ids):
            data[f"attached_media[{i}]"] = f'{{"media_fbid":"{pid}"}}'
        return self._post(f"{page_id}/feed", data=data)["id"]

    def post_permalink(self, post_id: str, token: str) -> str:
        try:
            return self._get(post_id, fields="permalink_url", access_token=token).get(
                "permalink_url", ""
            )
        except GraphError:
            return ""

    # --- Instagram --------------------------------------------------------------

    def _wait_container(self, container_id: str, token: str, timeout: float = 120) -> None:
        deadline = time.monotonic() + timeout
        while True:
            status = self._get(container_id, fields="status_code", access_token=token).get(
                "status_code"
            )
            if status in (None, "FINISHED", "PUBLISHED"):
                return
            if status in ("ERROR", "EXPIRED"):
                raise GraphError(f"Instagram medyayı işleyemedi (durum: {status}).")
            if time.monotonic() > deadline:
                raise GraphError("Instagram medya işleme zaman aşımına uğradı.")
            time.sleep(self.poll_interval)

    def publish_instagram(self, ig_user_id: str, token: str, caption: str, image_urls: list[str]) -> str:
        if not image_urls:
            raise GraphError("Instagram için en az bir fotoğraf gerekli.")
        if len(image_urls) == 1:
            container = self._post(
                f"{ig_user_id}/media",
                data={"image_url": image_urls[0], "caption": caption, "access_token": token},
            )["id"]
        else:
            children = []
            for url in image_urls:
                child = self._post(
                    f"{ig_user_id}/media",
                    data={"image_url": url, "is_carousel_item": "true", "access_token": token},
                )["id"]
                children.append(child)
            for child in children:
                self._wait_container(child, token)
            container = self._post(
                f"{ig_user_id}/media",
                data={
                    "media_type": "CAROUSEL",
                    "children": ",".join(children),
                    "caption": caption,
                    "access_token": token,
                },
            )["id"]
        self._wait_container(container, token)
        return self._post(
            f"{ig_user_id}/media_publish",
            data={"creation_id": container, "access_token": token},
        )["id"]

    def instagram_permalink(self, media_id: str, token: str) -> str:
        try:
            return self._get(media_id, fields="permalink", access_token=token).get("permalink", "")
        except GraphError:
            return ""
