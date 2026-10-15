from PIL import Image

from paylasim import images
from paylasim.text import hashtag_count, x_intent_url, x_length


def test_x_length_turkish_letters_count_as_one():
    assert x_length("Öğretmenlerimize teşekkürler ğüşıöç") == len("Öğretmenlerimize teşekkürler ğüşıöç")


def test_x_length_urls_count_as_23():
    assert x_length("Haber: https://example.com/cok/uzun/bir/adres?x=1") == len("Haber: ") + 23


def test_x_length_emoji_counts_as_two():
    assert x_length("🇹🇷") == 4
    assert x_length("👍") == 2


def test_hashtag_count():
    assert hashtag_count("#Eğitim #MEB ve #23Nisan kutlu olsun") == 3


def test_x_intent_url_encodes_text():
    url = x_intent_url("Merhaba dünya #MEB")
    assert url.startswith("https://x.com/intent/post?text=")
    assert "%23MEB" in url and " " not in url


def test_instagram_square_unchanged(make_image, tmp_path):
    out = images.prepare_instagram(make_image(size=(1080, 1080)), tmp_path / "ig.jpg")
    with Image.open(out) as im:
        assert im.size == (1080, 1080)
        assert im.format == "JPEG"


def test_instagram_tall_photo_padded_to_4x5(make_image, tmp_path):
    out = images.prepare_instagram(make_image(size=(900, 1600)), tmp_path / "ig.jpg")
    with Image.open(out) as im:
        assert abs(im.width / im.height - 0.8) < 0.01


def test_instagram_panorama_padded_and_shrunk(make_image, tmp_path):
    out = images.prepare_instagram(make_image(size=(4000, 1000)), tmp_path / "ig.jpg")
    with Image.open(out) as im:
        assert im.width <= images.IG_MAX_WIDTH
        assert im.width / im.height <= images.IG_MAX_RATIO + 0.01


def test_png_with_transparency_converted_to_jpeg(make_image, tmp_path):
    src = make_image("logo.png", size=(500, 500), mode="RGBA")
    out = images.prepare_facebook(src, tmp_path / "fb.jpg")
    with Image.open(out) as im:
        assert im.format == "JPEG" and im.mode == "RGB"


def test_facebook_large_photo_shrunk(make_image, tmp_path):
    out = images.prepare_facebook(make_image(size=(6000, 4000)), tmp_path / "fb.jpg")
    with Image.open(out) as im:
        assert max(im.size) == images.FB_MAX_SIDE
