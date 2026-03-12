"""SQLite persistence for chat sessions and messages.

Database location: {projectRoot}/.remnote-bridge-chat.db
Survives daemon restarts — sessions and history are durable.
"""

from __future__ import annotations

import time
import uuid
from dataclasses import dataclass
from pathlib import Path

import aiosqlite

# ── Data models ──


@dataclass
class SessionInfo:
    id: str
    title: str
    created_at: float
    updated_at: float
    message_count: int
    summary: str | None = None


@dataclass
class Message:
    id: str
    session_id: str
    role: str  # "user" | "assistant" | "system"
    content: str
    timestamp: float


# ── Schema ──

_SCHEMA = """
CREATE TABLE IF NOT EXISTS sessions (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL DEFAULT 'New Chat',
    created_at  REAL NOT NULL,
    updated_at  REAL NOT NULL,
    summary     TEXT
);

CREATE TABLE IF NOT EXISTS messages (
    id          TEXT PRIMARY KEY,
    session_id  TEXT NOT NULL,
    role        TEXT NOT NULL,
    content     TEXT NOT NULL,
    timestamp   REAL NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_session
    ON messages(session_id, timestamp);
"""


class ChatStorage:
    """Async SQLite storage for chat data."""

    def __init__(self, db_path: str | Path) -> None:
        self._db_path = str(db_path)
        self._db: aiosqlite.Connection | None = None

    async def open(self) -> None:
        self._db = await aiosqlite.connect(self._db_path)
        self._db.row_factory = aiosqlite.Row
        await self._db.execute("PRAGMA journal_mode=WAL")
        await self._db.execute("PRAGMA foreign_keys=ON")
        await self._db.executescript(_SCHEMA)
        await self._db.commit()

    async def close(self) -> None:
        if self._db:
            await self._db.close()
            self._db = None

    @property
    def db(self) -> aiosqlite.Connection:
        if self._db is None:
            raise RuntimeError("ChatStorage not opened — call open() first")
        return self._db

    # ── Sessions ──

    async def create_session(self, title: str = "New Chat") -> SessionInfo:
        now = time.time()
        sid = uuid.uuid4().hex[:12]
        await self.db.execute(
            "INSERT INTO sessions (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)",
            (sid, title, now, now),
        )
        await self.db.commit()
        return SessionInfo(id=sid, title=title, created_at=now, updated_at=now, message_count=0)

    async def list_sessions(self) -> list[SessionInfo]:
        cursor = await self.db.execute(
            """
            SELECT s.id, s.title, s.created_at, s.updated_at, s.summary,
                   COUNT(m.id) as message_count
            FROM sessions s
            LEFT JOIN messages m ON m.session_id = s.id
            GROUP BY s.id
            ORDER BY s.updated_at DESC
            """
        )
        rows = await cursor.fetchall()
        return [
            SessionInfo(
                id=r["id"],
                title=r["title"],
                created_at=r["created_at"],
                updated_at=r["updated_at"],
                message_count=r["message_count"],
                summary=r["summary"],
            )
            for r in rows
        ]

    async def get_session(self, session_id: str) -> SessionInfo | None:
        cursor = await self.db.execute(
            """
            SELECT s.id, s.title, s.created_at, s.updated_at, s.summary,
                   COUNT(m.id) as message_count
            FROM sessions s
            LEFT JOIN messages m ON m.session_id = s.id
            WHERE s.id = ?
            GROUP BY s.id
            """,
            (session_id,),
        )
        r = await cursor.fetchone()
        if r is None:
            return None
        return SessionInfo(
            id=r["id"],
            title=r["title"],
            created_at=r["created_at"],
            updated_at=r["updated_at"],
            message_count=r["message_count"],
            summary=r["summary"],
        )

    async def delete_session(self, session_id: str) -> bool:
        cursor = await self.db.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
        await self.db.commit()
        return cursor.rowcount > 0

    async def update_session_summary(self, session_id: str, summary: str) -> None:
        await self.db.execute(
            "UPDATE sessions SET summary = ?, updated_at = ? WHERE id = ?",
            (summary, time.time(), session_id),
        )
        await self.db.commit()

    async def update_session_title(self, session_id: str, title: str) -> None:
        await self.db.execute(
            "UPDATE sessions SET title = ?, updated_at = ? WHERE id = ?",
            (title, time.time(), session_id),
        )
        await self.db.commit()

    # ── Messages ──

    async def add_message(self, session_id: str, role: str, content: str) -> Message:
        now = time.time()
        mid = uuid.uuid4().hex[:16]
        await self.db.execute(
            "INSERT INTO messages (id, session_id, role, content, timestamp) VALUES (?, ?, ?, ?, ?)",
            (mid, session_id, role, content, now),
        )
        await self.db.execute(
            "UPDATE sessions SET updated_at = ? WHERE id = ?", (now, session_id)
        )
        await self.db.commit()
        return Message(id=mid, session_id=session_id, role=role, content=content, timestamp=now)

    async def get_messages(self, session_id: str) -> list[Message]:
        cursor = await self.db.execute(
            "SELECT id, session_id, role, content, timestamp FROM messages WHERE session_id = ? ORDER BY timestamp ASC",
            (session_id,),
        )
        rows = await cursor.fetchall()
        return [
            Message(
                id=r["id"],
                session_id=r["session_id"],
                role=r["role"],
                content=r["content"],
                timestamp=r["timestamp"],
            )
            for r in rows
        ]

    async def get_message_count(self, session_id: str) -> int:
        cursor = await self.db.execute(
            "SELECT COUNT(*) as cnt FROM messages WHERE session_id = ?",
            (session_id,),
        )
        row = await cursor.fetchone()
        return row["cnt"] if row else 0
