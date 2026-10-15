"""Uygulama klasörleri, ayarlar ve erişim anahtarının (token) güvenli saklanması."""

from __future__ import annotations

import json
import os
import sys
from dataclasses import asdict, dataclass
from pathlib import Path

GRAPH_API_VERSION = "v23.0"
KEYRING_SERVICE = "BHI-Paylasim"
KEYRING_USER = "facebook-page-token"


def data_dir() -> Path:
    """Kullanıcıya özel veri klasörü (Windows'ta %LOCALAPPDATA%\\BHI-Paylasim)."""
    override = os.environ.get("PAYLASIM_DATA_DIR")
    if override:
        base = Path(override)
    elif sys.platform == "win32":
        base = Path(os.environ.get("LOCALAPPDATA", Path.home())) / "BHI-Paylasim"
    else:
        base = Path.home() / ".bhi-paylasim"
    base.mkdir(parents=True, exist_ok=True)
    return base


def posts_dir() -> Path:
    path = data_dir() / "paylasimlar"
    path.mkdir(parents=True, exist_ok=True)
    return path


@dataclass
class Settings:
    page_id: str = ""
    page_name: str = ""
    ig_user_id: str = ""
    ig_username: str = ""

    @property
    def connected(self) -> bool:
        return bool(self.page_id) and get_token() is not None


def _settings_file() -> Path:
    return data_dir() / "ayarlar.json"


def load_settings() -> Settings:
    path = _settings_file()
    if not path.exists():
        return Settings()
    raw = json.loads(path.read_text(encoding="utf-8"))
    known = {k: v for k, v in raw.items() if k in Settings.__dataclass_fields__}
    return Settings(**known)


def save_settings(settings: Settings) -> None:
    _settings_file().write_text(
        json.dumps(asdict(settings), ensure_ascii=False, indent=2), encoding="utf-8"
    )


# --- Token saklama -------------------------------------------------------------
# Windows'ta token "Kimlik Bilgileri Yöneticisi"nde (Credential Manager) şifreli tutulur.
# keyring kullanılamayan ortamlarda (ör. geliştirme amaçlı Linux) dosyaya düşülür.


def _keyring():
    try:
        import keyring
        from keyring.backends import fail

        if isinstance(keyring.get_keyring(), fail.Keyring):
            return None
        return keyring
    except Exception:
        return None


def _token_file() -> Path:
    return data_dir() / ".token"


def get_token() -> str | None:
    kr = _keyring()
    if kr is not None:
        try:
            return kr.get_password(KEYRING_SERVICE, KEYRING_USER)
        except Exception:
            pass
    path = _token_file()
    return path.read_text(encoding="utf-8").strip() if path.exists() else None


def set_token(token: str) -> None:
    kr = _keyring()
    if kr is not None:
        try:
            kr.set_password(KEYRING_SERVICE, KEYRING_USER, token)
            return
        except Exception:
            pass
    path = _token_file()
    path.write_text(token, encoding="utf-8")
    try:
        path.chmod(0o600)
    except OSError:
        pass


def delete_token() -> None:
    kr = _keyring()
    if kr is not None:
        try:
            kr.delete_password(KEYRING_SERVICE, KEYRING_USER)
        except Exception:
            pass
    _token_file().unlink(missing_ok=True)
