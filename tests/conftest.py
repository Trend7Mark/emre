import pytest
from PIL import Image


@pytest.fixture(autouse=True)
def isolated_data_dir(tmp_path, monkeypatch):
    """Her test kendi geçici veri klasörünü ve dosya tabanlı token deposunu kullanır."""
    monkeypatch.setenv("PAYLASIM_DATA_DIR", str(tmp_path / "data"))
    monkeypatch.setattr("paylasim.config._keyring", lambda: None)
    return tmp_path / "data"


@pytest.fixture
def make_image(tmp_path):
    def _make(name="foto.jpg", size=(1080, 1080), mode="RGB", fmt=None):
        path = tmp_path / name
        Image.new(mode, size, (200, 30, 30) if mode == "RGB" else None).save(path, fmt)
        return path

    return _make
