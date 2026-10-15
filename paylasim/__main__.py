"""Uygulamayı başlatır ve tarayıcıda açar: python -m paylasim"""

from __future__ import annotations

import socket
import threading
import webbrowser

from . import APP_NAME, __version__
from .config import data_dir

HOST = "127.0.0.1"
PORT = 8765


def _port_in_use() -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex((HOST, PORT)) == 0


def main() -> None:
    url = f"http://{HOST}:{PORT}/"
    if _port_in_use():
        # Program zaten açık; sadece tarayıcıda göster.
        webbrowser.open(url)
        return

    from waitress import serve

    from .app import create_app

    print(f"{APP_NAME} {__version__}")
    print(f"Adres      : {url}")
    print(f"Veri klasörü: {data_dir()}")
    print("Programı kapatmak için bu pencereyi kapatın.")
    threading.Timer(1.0, lambda: webbrowser.open(url)).start()
    serve(create_app(), host=HOST, port=PORT, threads=4)


if __name__ == "__main__":
    main()
