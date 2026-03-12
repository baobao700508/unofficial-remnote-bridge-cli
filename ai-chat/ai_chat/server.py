"""FastAPI HTTP server for AI Chat — SSE streaming endpoint.

Started as a subprocess by the daemon when aiChat.enabled is true.
Communicates with the daemon via HTTP (daemon proxies WS ↔ HTTP).

Usage:
    python -m ai_chat.server --port 3005 --db-path /path/to/.remnote-bridge-chat.db

Environment variables (set by daemon):
    AI_CHAT_ENDPOINT    — OpenAI-compatible API endpoint
    AI_CHAT_MODEL       — Model name
    AI_CHAT_API_KEY     — API key
    AI_CHAT_SYSTEM_PROMPT — Optional custom system prompt
    AI_CHAT_MAX_HISTORY_TOKENS — Max context tokens (default 8000)
    AI_CHAT_SUMMARY_THRESHOLD  — Messages before summarization (default 20)
    AI_CHAT_MCP_COMMAND — MCP server command (default "remnote-bridge")
    AI_CHAT_MCP_ARGS    — MCP server args (default "mcp")
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
from contextlib import asynccontextmanager
from typing import Any

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from .agent import ChatAgent, StreamEvent, create_agent_from_env
from .context import ContextManager
from .session import SessionManager
from .storage import ChatStorage

# ── Request / Response models ──


class ChatRequest(BaseModel):
    session_id: str
    message: str


class CreateSessionRequest(BaseModel):
    title: str = "New Chat"


# ── Global state ──

_agent: ChatAgent | None = None
_session_mgr: SessionManager | None = None
_context_mgr: ContextManager | None = None
_storage: ChatStorage | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage startup/shutdown of agent and storage."""
    global _agent, _session_mgr, _context_mgr, _storage

    db_path = os.environ.get("AI_CHAT_DB_PATH", ".remnote-bridge-chat.db")
    max_tokens = int(os.environ.get("AI_CHAT_MAX_HISTORY_TOKENS", "8000"))
    summary_threshold = int(os.environ.get("AI_CHAT_SUMMARY_THRESHOLD", "20"))
    system_prompt = os.environ.get("AI_CHAT_SYSTEM_PROMPT", "")

    _storage = ChatStorage(db_path)
    await _storage.open()

    _session_mgr = SessionManager(_storage)

    _agent = create_agent_from_env()
    await _agent.start()

    from .agent import DEFAULT_SYSTEM_PROMPT

    prompt = system_prompt if system_prompt else DEFAULT_SYSTEM_PROMPT
    _context_mgr = ContextManager(
        system_prompt=prompt,
        max_history_tokens=max_tokens,
        summary_threshold=summary_threshold,
    )

    yield

    if _agent:
        await _agent.stop()
    if _storage:
        await _storage.close()


app = FastAPI(title="RemNote Bridge AI Chat", lifespan=lifespan)


# ── Endpoints ──


@app.get("/health")
async def health():
    return {"status": "ok", "agent_ready": _agent is not None}


@app.post("/chat")
async def chat(req: ChatRequest):
    """Stream a chat response as SSE events."""
    if not _agent or not _session_mgr or not _context_mgr:
        raise HTTPException(503, "Server not ready")

    session = await _session_mgr.get_or_load_session(req.session_id)
    if session is None:
        # Auto-create session if it doesn't exist
        session = await _session_mgr.create_session()
        if session.info.id != req.session_id:
            # Caller specified an unknown ID — create with that ID not possible,
            # so just use the new one. This shouldn't normally happen.
            pass

    # Store user message
    await _session_mgr.add_message(req.session_id, "user", req.message)

    # Reload messages for context preparation
    session = await _session_mgr.get_or_load_session(req.session_id)
    if session is None:
        raise HTTPException(404, "Session not found")

    # Prepare context with truncation
    prepared = _context_mgr.prepare_messages(
        session.messages,
        existing_summary=session.info.summary,
    )

    async def event_stream():
        """Generate SSE events from the agent stream."""
        full_response = ""

        # Stream from agent — pass prepared history (skip system prompt, it's in agent)
        # Filter to only user/assistant messages for the history
        history_for_agent = [
            m for m in prepared.messages
            if m["role"] in ("user", "assistant") and m["content"] != req.message
        ]
        # Add system context summary if present
        system_context = [m for m in prepared.messages if m["role"] == "system" and "summary" in m.get("content", "").lower()]

        combined_history = system_context + history_for_agent

        async for event in _agent.stream_chat(req.message, combined_history or None):
            if event.type == "text_delta":
                text = event.data.get("text", "")
                full_response += text
                payload = json.dumps(
                    {"chunk": text, "done": False}, ensure_ascii=False
                )
                yield f"data: {payload}\n\n"

            elif event.type == "tool_call":
                payload = json.dumps(
                    {
                        "chunk": "",
                        "done": False,
                        "toolCall": {
                            "name": event.data.get("name", ""),
                            "args": event.data.get("args", ""),
                            "status": "calling",
                        },
                    },
                    ensure_ascii=False,
                )
                yield f"data: {payload}\n\n"

            elif event.type == "tool_result":
                payload = json.dumps(
                    {
                        "chunk": "",
                        "done": False,
                        "toolCall": {
                            "name": event.data.get("name", ""),
                            "result": event.data.get("result", ""),
                            "status": "done",
                        },
                    },
                    ensure_ascii=False,
                )
                yield f"data: {payload}\n\n"

            elif event.type == "done":
                # Store assistant response
                if full_response:
                    await _session_mgr.add_message(
                        req.session_id, "assistant", full_response
                    )

                # Check if we need to generate a summary
                msg_count = len(session.messages) + 2  # +user +assistant
                if _context_mgr.needs_summary(msg_count, session.info.summary):
                    # Generate summary in background (don't block SSE)
                    asyncio.create_task(
                        _generate_summary(req.session_id, session.info.summary)
                    )

                # Auto-title on first message
                if session.info.title == "New Chat" and session.info.message_count <= 1:
                    asyncio.create_task(_auto_title(req.session_id, req.message))

                payload = json.dumps({"chunk": "", "done": True}, ensure_ascii=False)
                yield f"data: {payload}\n\n"

            elif event.type == "error":
                payload = json.dumps(
                    {
                        "chunk": "",
                        "done": True,
                        "error": event.data.get("error", "Unknown error"),
                    },
                    ensure_ascii=False,
                )
                yield f"data: {payload}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


async def _generate_summary(session_id: str, existing_summary: str | None) -> None:
    """Background task: generate and store a conversation summary."""
    if not _agent or not _session_mgr or not _context_mgr:
        return
    try:
        messages = await _session_mgr.get_history(session_id)
        prompt = _context_mgr.build_summary_prompt(messages, existing_summary)
        summary = await _agent.generate_summary(prompt)
        await _session_mgr.update_summary(session_id, summary)
    except Exception as e:
        print(f"[ai-chat] Summary generation failed: {e}", file=sys.stderr)


async def _auto_title(session_id: str, first_message: str) -> None:
    """Background task: generate a session title from the first message."""
    if not _agent or not _session_mgr:
        return
    try:
        title = await _agent.generate_title(first_message)
        await _session_mgr.update_title(session_id, title)
    except Exception as e:
        print(f"[ai-chat] Title generation failed: {e}", file=sys.stderr)


# ── Session management endpoints ──


@app.get("/sessions")
async def list_sessions():
    if not _session_mgr:
        raise HTTPException(503, "Server not ready")
    sessions = await _session_mgr.list_sessions()
    return {
        "sessions": [
            {
                "id": s.id,
                "title": s.title,
                "createdAt": s.created_at,
                "updatedAt": s.updated_at,
                "messageCount": s.message_count,
            }
            for s in sessions
        ]
    }


@app.post("/sessions")
async def create_session(req: CreateSessionRequest):
    if not _session_mgr:
        raise HTTPException(503, "Server not ready")
    session = await _session_mgr.create_session(req.title)
    return {
        "id": session.info.id,
        "title": session.info.title,
        "createdAt": session.info.created_at,
    }


@app.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    if not _session_mgr:
        raise HTTPException(503, "Server not ready")
    ok = await _session_mgr.delete_session(session_id)
    if not ok:
        raise HTTPException(404, "Session not found")
    return {"ok": True}


@app.get("/sessions/{session_id}/history")
async def get_session_history(session_id: str):
    if not _session_mgr:
        raise HTTPException(503, "Server not ready")
    messages = await _session_mgr.get_history(session_id)
    return {
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "timestamp": m.timestamp,
            }
            for m in messages
        ]
    }


# ── CLI entry point ──


def main():
    parser = argparse.ArgumentParser(description="RemNote Bridge AI Chat Server")
    parser.add_argument("--port", type=int, default=3005)
    parser.add_argument("--host", type=str, default="127.0.0.1")
    parser.add_argument("--db-path", type=str, default=".remnote-bridge-chat.db")
    args = parser.parse_args()

    os.environ.setdefault("AI_CHAT_DB_PATH", args.db_path)

    uvicorn.run(app, host=args.host, port=args.port, log_level="info")


if __name__ == "__main__":
    main()
