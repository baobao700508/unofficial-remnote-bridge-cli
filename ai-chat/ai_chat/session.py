"""Session manager — coordinates storage + context for active chat sessions."""

from __future__ import annotations

from dataclasses import dataclass, field

from .storage import ChatStorage, Message, SessionInfo


@dataclass
class ActiveSession:
    """In-memory representation of a session being actively chatted in."""

    info: SessionInfo
    messages: list[Message] = field(default_factory=list)


class SessionManager:
    """High-level session operations backed by ChatStorage."""

    def __init__(self, storage: ChatStorage) -> None:
        self._storage = storage
        self._active: dict[str, ActiveSession] = {}

    @property
    def storage(self) -> ChatStorage:
        return self._storage

    async def create_session(self, title: str = "New Chat") -> ActiveSession:
        info = await self._storage.create_session(title)
        active = ActiveSession(info=info, messages=[])
        self._active[info.id] = active
        return active

    async def get_or_load_session(self, session_id: str) -> ActiveSession | None:
        if session_id in self._active:
            return self._active[session_id]

        info = await self._storage.get_session(session_id)
        if info is None:
            return None

        messages = await self._storage.get_messages(session_id)
        active = ActiveSession(info=info, messages=messages)
        self._active[session_id] = active
        return active

    async def add_message(self, session_id: str, role: str, content: str) -> Message:
        msg = await self._storage.add_message(session_id, role, content)
        if session_id in self._active:
            self._active[session_id].messages.append(msg)
        return msg

    async def list_sessions(self) -> list[SessionInfo]:
        return await self._storage.list_sessions()

    async def delete_session(self, session_id: str) -> bool:
        self._active.pop(session_id, None)
        return await self._storage.delete_session(session_id)

    async def get_history(self, session_id: str) -> list[Message]:
        return await self._storage.get_messages(session_id)

    async def update_title(self, session_id: str, title: str) -> None:
        await self._storage.update_session_title(session_id, title)
        if session_id in self._active:
            self._active[session_id].info.title = title

    async def update_summary(self, session_id: str, summary: str) -> None:
        await self._storage.update_session_summary(session_id, summary)
        if session_id in self._active:
            self._active[session_id].info.summary = summary

    def evict_inactive(self, keep_ids: set[str] | None = None, max_cached: int = 10) -> None:
        """Evict least-recently-used in-memory sessions to bound memory."""
        if len(self._active) <= max_cached:
            return
        keep = keep_ids or set()
        candidates = [
            (sid, s) for sid, s in self._active.items() if sid not in keep
        ]
        candidates.sort(key=lambda x: x[1].info.updated_at)
        to_remove = len(self._active) - max_cached
        for sid, _ in candidates[:to_remove]:
            del self._active[sid]
