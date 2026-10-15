"""Yerel web arayüzü (yalnızca bu bilgisayardan, 127.0.0.1 üzerinden erişilir)."""

from __future__ import annotations

import os
import subprocess
import sys
import webbrowser
from datetime import datetime
from pathlib import Path

from flask import Flask, abort, jsonify, request, send_from_directory
from PIL import Image, UnidentifiedImageError

from . import APP_NAME, __version__, history, publisher
from .config import (
    Settings,
    delete_token,
    load_settings,
    posts_dir,
    save_settings,
    set_token,
)
from .graph import GraphClient, GraphError
from .text import IG_CAPTION_LIMIT, X_LIMIT, hashtag_count, x_length

STATIC_DIR = Path(__file__).parent / "static"
ALLOWED_HOSTS = {"127.0.0.1", "localhost"}


def open_folder(path: Path, select: Path | None = None) -> None:
    try:
        if sys.platform == "win32":
            if select is not None:
                subprocess.Popen(["explorer", "/select,", str(select)])
            else:
                os.startfile(str(path))  # type: ignore[attr-defined]
        elif sys.platform == "darwin":
            subprocess.Popen(["open", str(path)])
        else:
            subprocess.Popen(["xdg-open", str(path)])
    except Exception:
        pass


def create_app(client_factory=GraphClient, open_browser=webbrowser.open, folder_opener=open_folder) -> Flask:
    app = Flask(__name__, static_folder=None)
    app.config["MAX_CONTENT_LENGTH"] = 300 * 1024 * 1024
    pending_pages: dict[str, object] = {}

    @app.before_request
    def guard():
        # Başka bir web sitesinin tarayıcı üzerinden bu yerel uygulamaya istek göndermesini engelle.
        host = (request.host or "").rsplit(":", 1)[0]
        if host not in ALLOWED_HOSTS:
            abort(403)
        if request.method == "POST" and request.headers.get("X-Paylasim") != "1":
            abort(403)

    @app.errorhandler(GraphError)
    def graph_error(exc):
        return jsonify(error=str(exc)), 400

    # --- Sayfalar -----------------------------------------------------------------

    @app.get("/")
    def index():
        return send_from_directory(STATIC_DIR, "index.html")

    @app.get("/static/<path:name>")
    def static_files(name):
        return send_from_directory(STATIC_DIR, name)

    # --- Durum ve bağlantı ----------------------------------------------------------

    @app.get("/api/status")
    def status():
        s = load_settings()
        return jsonify(
            app=APP_NAME,
            version=__version__,
            connected=s.connected,
            page_name=s.page_name,
            ig_username=s.ig_username,
            limits={"x": X_LIMIT, "instagram": IG_CAPTION_LIMIT},
        )

    @app.post("/api/connect")
    def connect():
        body = request.get_json(force=True)
        app_id = (body.get("app_id") or "").strip()
        app_secret = (body.get("app_secret") or "").strip()
        user_token = (body.get("user_token") or "").strip()
        if not (app_id and app_secret and user_token):
            return jsonify(error="Uygulama Kimliği, Uygulama Gizli Anahtarı ve erişim anahtarı gerekli."), 400
        client = client_factory()
        long_token = client.exchange_long_lived_user_token(app_id, app_secret, user_token)
        pages = client.list_pages(long_token)
        if not pages:
            return jsonify(error="Bu hesabın yönettiği bir Facebook Sayfası bulunamadı. "
                                 "Erişim anahtarını oluştururken sayfayı seçtiğinizden emin olun."), 400
        pending_pages.clear()
        pending_pages.update({p.id: p for p in pages})
        return jsonify(
            pages=[
                {"id": p.id, "name": p.name, "ig_username": p.ig_username, "has_ig": bool(p.ig_user_id)}
                for p in pages
            ]
        )

    @app.post("/api/select-page")
    def select_page():
        page_id = request.get_json(force=True).get("page_id")
        page = pending_pages.get(page_id)
        if page is None:
            return jsonify(error="Sayfa bulunamadı, bağlantıyı yeniden deneyin."), 400
        set_token(page.access_token)
        save_settings(
            Settings(
                page_id=page.id,
                page_name=page.name,
                ig_user_id=page.ig_user_id,
                ig_username=page.ig_username,
            )
        )
        pending_pages.clear()
        return jsonify(ok=True)

    @app.post("/api/disconnect")
    def disconnect():
        delete_token()
        save_settings(Settings())
        return jsonify(ok=True)

    # --- Metin kontrolü -------------------------------------------------------------

    @app.post("/api/count")
    def count():
        body = request.get_json(force=True)
        text = body.get("text", "")
        return jsonify(
            x=x_length(body.get("x_text", "")),
            instagram=len(text),
            hashtags=hashtag_count(text),
        )

    # --- Paylaşım --------------------------------------------------------------------

    @app.post("/api/publish")
    def publish():
        text = request.form.get("text", "").strip()
        x_text = request.form.get("x_text", "").strip() or text
        platforms = {p for p in request.form.getlist("platforms") if p in publisher.PLATFORMS}
        files = request.files.getlist("photos")

        folder = posts_dir() / datetime.now().strftime("%Y-%m-%d_%H%M%S")
        folder.mkdir(parents=True, exist_ok=True)
        photos: list[Path] = []
        for i, f in enumerate(files, 1):
            if not f or not f.filename:
                continue
            ext = Path(f.filename).suffix.lower() or ".jpg"
            dest = folder / f"foto_{i:02d}{ext}"
            f.save(dest)
            try:
                with Image.open(dest) as im:
                    im.verify()
            except (UnidentifiedImageError, OSError):
                dest.unlink(missing_ok=True)
                return jsonify(error=f"'{f.filename}' bir fotoğraf dosyası değil."), 400
            photos.append(dest)

        errors = publisher.validate(text, x_text, platforms, photos)
        if errors:
            return jsonify(error=" ".join(errors)), 400

        results = publisher.publish(
            text=text,
            x_text=x_text,
            platforms=platforms,
            photos=photos,
            work_dir=folder,
            settings=load_settings(),
            client=client_factory(),
        )
        (folder / "metin.txt").write_text(
            text + ("\n\n--- X metni ---\n" + x_text if x_text != text else ""), encoding="utf-8"
        )
        history.add(text, folder.name, len(photos), results)

        if "x" in results:
            open_browser(results["x"]["url"])
            if photos:
                folder_opener(folder, photos[0])
        return jsonify(results=results, folder=folder.name)

    @app.get("/api/history")
    def get_history():
        return jsonify(items=history.recent())

    @app.post("/api/open-folder")
    def open_post_folder():
        name = request.get_json(force=True).get("folder", "")
        folder = (posts_dir() / name).resolve()
        if folder.parent != posts_dir().resolve() or not folder.is_dir():
            abort(404)
        photos = sorted(folder.glob("foto_*"))
        folder_opener(folder, photos[0] if photos else None)
        return jsonify(ok=True)

    return app
