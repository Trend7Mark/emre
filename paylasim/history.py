"""Paylaşım geçmişi (yerel SQLite veritabanı)."""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime

from .config import data_dir


def _conn() -> sqlite3.Connection:
    conn = sqlite3.connect(data_dir() / "gecmis.db")
    conn.row_factory = sqlite3.Row
    conn.execute(
        """CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT NOT NULL,
            text TEXT NOT NULL,
            folder TEXT NOT NULL,
            photo_count INTEGER NOT NULL,
            results TEXT NOT NULL
        )"""
    )
    return conn


def add(text: str, folder: str, photo_count: int, results: dict) -> int:
    with _conn() as conn:
        cur = conn.execute(
            "INSERT INTO posts (created_at, text, folder, photo_count, results) VALUES (?,?,?,?,?)",
            (
                datetime.now().isoformat(timespec="seconds"),
                text,
                folder,
                photo_count,
                json.dumps(results, ensure_ascii=False),
            ),
        )
        return cur.lastrowid


def recent(limit: int = 50) -> list[dict]:
    with _conn() as conn:
        rows = conn.execute("SELECT * FROM posts ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
    out = []
    for r in rows:
        item = dict(r)
        item["results"] = json.loads(item["results"])
        out.append(item)
    return out
