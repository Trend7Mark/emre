import io

import pytest
from PIL import Image

from paylasim import config, history
from paylasim.app import create_app
from paylasim.graph import GraphError, PageInfo

HEADERS = {"X-Paylasim": "1"}


class FakeClient:
    """Gerçek Meta API'sine gitmeden paylaşım akışını taklit eder."""

    instances = []

    def __init__(self):
        self.uploaded = []
        self.fb_posts = []
        self.ig_posts = []
        self.fail_instagram = False
        FakeClient.instances.append(self)

    def exchange_long_lived_user_token(self, app_id, app_secret, short_token):
        if short_token == "bad":
            raise GraphError("Invalid OAuth access token (kod 190)")
        return "LONG"

    def list_pages(self, user_token):
        return [PageInfo("10", "İl MEM", "PAGE_TOKEN", "20", "ilmem")]

    def upload_unpublished_photo(self, page_id, token, image):
        self.uploaded.append(image.name)
        return f"photo{len(self.uploaded)}"

    def photo_source_url(self, photo_id, token):
        return f"https://cdn.example/{photo_id}.jpg"

    def create_page_post(self, page_id, token, message, photo_ids):
        self.fb_posts.append((message, photo_ids))
        return "10_1"

    def post_permalink(self, post_id, token):
        return "https://facebook.com/post"

    def publish_instagram(self, ig_user_id, token, caption, urls):
        if self.fail_instagram:
            raise GraphError("Instagram hatası")
        self.ig_posts.append((caption, urls))
        return "ig1"

    def instagram_permalink(self, media_id, token):
        return "https://instagram.com/p/x"


@pytest.fixture
def opened():
    return {"browser": [], "folders": []}


@pytest.fixture
def client(opened):
    FakeClient.instances.clear()
    app = create_app(
        client_factory=FakeClient,
        open_browser=opened["browser"].append,
        folder_opener=lambda folder, select=None: opened["folders"].append(folder),
    )
    return app.test_client()


@pytest.fixture
def connected():
    config.set_token("PAGE_TOKEN")
    config.save_settings(config.Settings("10", "İl MEM", "20", "ilmem"))


def jpeg_bytes(size=(800, 800)):
    buf = io.BytesIO()
    Image.new("RGB", size, (10, 120, 200)).save(buf, "JPEG")
    buf.seek(0)
    return buf


def test_rejects_requests_without_header(client):
    assert client.post("/api/disconnect").status_code == 403


def test_rejects_foreign_host(client):
    resp = client.get("/api/status", headers={"Host": "evil.example:8765"})
    assert resp.status_code == 403


def test_index_served(client):
    resp = client.get("/")
    assert resp.status_code == 200 and "BHİ Paylaşım".encode() in resp.data


def test_connect_and_select_page(client):
    resp = client.post(
        "/api/connect",
        json={"app_id": "1", "app_secret": "s", "user_token": "short"},
        headers=HEADERS,
    )
    assert resp.status_code == 200
    assert resp.get_json()["pages"][0]["ig_username"] == "ilmem"
    assert "access_token" not in str(resp.get_json())

    resp = client.post("/api/select-page", json={"page_id": "10"}, headers=HEADERS)
    assert resp.status_code == 200
    assert config.get_token() == "PAGE_TOKEN"
    status = client.get("/api/status").get_json()
    assert status["connected"] and status["ig_username"] == "ilmem"


def test_connect_bad_token_shows_error(client):
    resp = client.post(
        "/api/connect", json={"app_id": "1", "app_secret": "s", "user_token": "bad"}, headers=HEADERS
    )
    assert resp.status_code == 400
    assert "Invalid OAuth" in resp.get_json()["error"]


def test_publish_all_platforms(client, connected, opened):
    resp = client.post(
        "/api/publish",
        data={
            "text": "23 Nisan kutlu olsun #23Nisan",
            "platforms": ["facebook", "instagram", "x"],
            "photos": [(jpeg_bytes(), "a.jpg"), (jpeg_bytes((900, 1600)), "b.jpg")],
        },
        headers=HEADERS,
        content_type="multipart/form-data",
    )
    assert resp.status_code == 200, resp.get_json()
    results = resp.get_json()["results"]
    assert results["facebook"] == {"ok": True, "id": "10_1", "url": "https://facebook.com/post"}
    assert results["instagram"]["ok"] and results["instagram"]["url"]
    assert results["x"]["manual"] and "23+Nisan+kutlu" in results["x"]["url"]

    fake = FakeClient.instances[-1]
    assert fake.fb_posts[0] == ("23 Nisan kutlu olsun #23Nisan", ["photo1", "photo2"])
    assert len(fake.ig_posts[0][1]) == 2
    assert opened["browser"] == [results["x"]["url"]]
    assert len(opened["folders"]) == 1

    item = history.recent()[0]
    assert item["photo_count"] == 2 and item["results"]["facebook"]["ok"]


def test_instagram_failure_does_not_block_facebook(client, connected):
    original = FakeClient.__init__

    def failing_init(self):
        original(self)
        self.fail_instagram = True

    FakeClient.__init__ = failing_init
    try:
        resp = client.post(
            "/api/publish",
            data={"text": "Deneme", "platforms": ["facebook", "instagram"], "photos": [(jpeg_bytes(), "a.jpg")]},
            headers=HEADERS,
            content_type="multipart/form-data",
        )
    finally:
        FakeClient.__init__ = original
    results = resp.get_json()["results"]
    assert results["facebook"]["ok"] is True
    assert results["instagram"] == {"ok": False, "error": "Instagram hatası"}


def test_instagram_requires_photo(client, connected):
    resp = client.post(
        "/api/publish",
        data={"text": "Sadece metin", "platforms": ["instagram"]},
        headers=HEADERS,
        content_type="multipart/form-data",
    )
    assert resp.status_code == 400
    assert "fotoğraf" in resp.get_json()["error"]


def test_x_text_too_long_rejected(client, connected):
    resp = client.post(
        "/api/publish",
        data={"text": "a" * 300, "platforms": ["x"]},
        headers=HEADERS,
        content_type="multipart/form-data",
    )
    assert resp.status_code == 400 and "280" in resp.get_json()["error"]


def test_separate_x_text_used(client, connected):
    resp = client.post(
        "/api/publish",
        data={"text": "a" * 300, "x_text": "Kısa metin", "platforms": ["facebook", "x"]},
        headers=HEADERS,
        content_type="multipart/form-data",
    )
    assert resp.status_code == 200
    assert "K%C4%B1sa" in resp.get_json()["results"]["x"]["url"]


def test_non_image_upload_rejected(client, connected):
    resp = client.post(
        "/api/publish",
        data={"text": "x", "platforms": ["facebook"], "photos": [(io.BytesIO(b"not an image"), "a.jpg")]},
        headers=HEADERS,
        content_type="multipart/form-data",
    )
    assert resp.status_code == 400


def test_publish_without_connection_reports_error(client):
    resp = client.post(
        "/api/publish",
        data={"text": "Deneme", "platforms": ["facebook"]},
        headers=HEADERS,
        content_type="multipart/form-data",
    )
    assert resp.get_json()["results"]["facebook"]["ok"] is False


def test_open_folder_rejects_path_traversal(client):
    resp = client.post("/api/open-folder", json={"folder": "../../etc"}, headers=HEADERS)
    assert resp.status_code == 404
