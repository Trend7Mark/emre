import pytest

from paylasim.graph import GraphClient, GraphError


class FakeResponse:
    def __init__(self, data, status=200):
        self._data = data
        self.status_code = status
        self.text = str(data)

    def json(self):
        return self._data

    def raise_for_status(self):
        if self.status_code >= 400:
            raise RuntimeError(self.status_code)


class FakeSession:
    """Graph API çağrılarını kaydeder ve sırayla hazır yanıtlar döndürür."""

    def __init__(self, handler):
        self.handler = handler
        self.calls = []

    def get(self, url, params=None, timeout=None):
        self.calls.append(("GET", url, params))
        return FakeResponse(self.handler("GET", url, params or {}))

    def post(self, url, data=None, files=None, timeout=None):
        self.calls.append(("POST", url, data))
        return FakeResponse(self.handler("POST", url, data or {}))


def test_error_message_is_readable():
    session = FakeSession(lambda *a: {"error": {"message": "Invalid token", "code": 190}})
    with pytest.raises(GraphError, match="yeniden bağlanın.*Invalid token \\(kod 190\\)"):
        GraphClient(session).check_page_token("1", "t")


def test_list_pages_reads_instagram_account():
    session = FakeSession(
        lambda *a: {
            "data": [
                {
                    "id": "10",
                    "name": "İl Milli Eğitim Müdürlüğü",
                    "access_token": "PAGE",
                    "instagram_business_account": {"id": "20", "username": "ilmem"},
                },
                {"id": "11", "name": "Başka Sayfa", "access_token": "P2"},
            ]
        }
    )
    pages = GraphClient(session).list_pages("USER")
    assert pages[0].ig_user_id == "20" and pages[0].ig_username == "ilmem"
    assert pages[1].ig_user_id == ""


def test_page_post_attaches_all_photos():
    session = FakeSession(lambda *a: {"id": "10_99"})
    GraphClient(session).create_page_post("10", "T", "Merhaba", ["p1", "p2"])
    _, url, data = session.calls[0]
    assert url.endswith("/10/feed")
    assert data["attached_media[0]"] == '{"media_fbid":"p1"}'
    assert data["attached_media[1]"] == '{"media_fbid":"p2"}'


def test_instagram_carousel_flow():
    counter = iter(range(100))

    def handler(method, url, params):
        if method == "GET":
            return {"status_code": "FINISHED"}
        return {"id": f"c{next(counter)}"}

    session = FakeSession(handler)
    media_id = GraphClient(session, poll_interval=0).publish_instagram(
        "20", "T", "Açıklama", ["https://cdn/a.jpg", "https://cdn/b.jpg"]
    )
    posts = [c for c in session.calls if c[0] == "POST"]
    assert posts[0][2]["is_carousel_item"] == "true"
    assert posts[1][2]["is_carousel_item"] == "true"
    assert posts[2][2]["media_type"] == "CAROUSEL"
    assert posts[2][2]["children"] == "c0,c1"
    assert posts[2][2]["caption"] == "Açıklama"
    assert posts[3][1].endswith("/20/media_publish")
    assert posts[3][2]["creation_id"] == "c2"
    assert media_id == "c3"


def test_instagram_container_error_raises():
    def handler(method, url, params):
        return {"status_code": "ERROR"} if method == "GET" else {"id": "c1"}

    with pytest.raises(GraphError, match="ERROR"):
        GraphClient(FakeSession(handler), poll_interval=0).publish_instagram("20", "T", "x", ["u"])


def test_photo_source_picks_largest():
    session = FakeSession(
        lambda *a: {
            "images": [
                {"width": 320, "height": 320, "source": "small"},
                {"width": 1440, "height": 1440, "source": "big"},
            ]
        }
    )
    assert GraphClient(session).photo_source_url("p1", "T") == "big"
