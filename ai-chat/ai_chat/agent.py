"""PydanticAI agent with MCP tool integration for RemNote operations.

Uses MCPServerStdio to connect to the remnote-bridge MCP server,
giving the agent access to all RemNote tools (read, edit, search, etc.).
Streams responses via agent.iter() for full tool call visibility.
"""

from __future__ import annotations

import json
import os
from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Any

from pydantic_ai import Agent
from pydantic_ai.agent import AgentRun, CallToolsNode, ModelRequestNode
from pydantic_ai.mcp import MCPServerStdio
from pydantic_ai.messages import (
    FunctionToolCallEvent,
    FunctionToolResultEvent,
    PartDeltaEvent,
    TextPartDelta,
)
from pydantic_ai.models.openai import OpenAIModel

# ── Default system prompt ──

DEFAULT_SYSTEM_PROMPT = """\
You are a helpful AI assistant integrated with RemNote, a knowledge management tool.
You have access to tools that let you read, edit, search, and navigate the user's
RemNote knowledge base.

Key capabilities:
- search: Find Rem by text query
- read-rem: Read a single Rem's content
- read-tree: Read a Rem and its children as a tree
- edit-rem: Edit a Rem's text content (str_replace style)
- edit-tree: Edit any node in a Rem tree
- read-globe: Read the top-level knowledge base structure
- read-context: Read the user's current focus context in RemNote

Guidelines:
- When the user asks about their notes, use search or read tools first
- For edits, always read the current content before modifying
- Be concise and helpful
- When showing Rem content, format it readably
- If a tool call fails, explain the error and suggest alternatives
"""


@dataclass
class StreamEvent:
    """A single event from the agent stream."""

    type: str  # "text_delta" | "tool_call" | "tool_result" | "done" | "error"
    data: dict[str, Any]


class ChatAgent:
    """Wraps PydanticAI Agent with MCP server lifecycle management."""

    def __init__(
        self,
        endpoint: str,
        model_name: str,
        api_key: str,
        mcp_command: str = "remnote-bridge",
        mcp_args: list[str] | None = None,
        system_prompt: str | None = None,
    ) -> None:
        self._endpoint = endpoint
        self._model_name = model_name
        self._api_key = api_key
        self._system_prompt = system_prompt or DEFAULT_SYSTEM_PROMPT
        self._mcp_command = mcp_command
        self._mcp_args = mcp_args or ["mcp"]

        # Build the OpenAI-compatible model
        self._model = OpenAIModel(
            self._model_name,
            base_url=self._endpoint,
            api_key=self._api_key,
        )

        # MCP server — connects to remnote-bridge via stdio
        self._mcp_server = MCPServerStdio(
            self._mcp_command,
            args=self._mcp_args,
            timeout=30,
        )

        # PydanticAI agent
        self._agent = Agent(
            self._model,
            system_prompt=self._system_prompt,
            toolsets=[self._mcp_server],
        )

        self._started = False

    async def start(self) -> None:
        """Start the MCP server subprocess."""
        if not self._started:
            await self._agent.__aenter__()
            self._started = True

    async def stop(self) -> None:
        """Stop the MCP server subprocess."""
        if self._started:
            await self._agent.__aexit__(None, None, None)
            self._started = False

    async def stream_chat(
        self,
        user_message: str,
        message_history: list[dict[str, str]] | None = None,
    ) -> AsyncIterator[StreamEvent]:
        """Stream a chat response, yielding events for text deltas and tool calls.

        Args:
            user_message: The user's message text.
            message_history: Optional list of prior messages [{"role": ..., "content": ...}].
                             If provided, these are passed as message_history to the agent.

        Yields:
            StreamEvent objects for each piece of the response.
        """
        if not self._started:
            await self.start()

        try:
            # Convert message_history to pydantic_ai format if provided
            history = None
            if message_history:
                from pydantic_ai.messages import (
                    ModelRequest,
                    ModelResponse,
                    SystemPromptPart,
                    TextPart,
                    UserPromptPart,
                )

                history = []
                for msg in message_history:
                    role = msg["role"]
                    content = msg["content"]
                    if role == "user":
                        history.append(ModelRequest(parts=[UserPromptPart(content=content)]))
                    elif role == "assistant":
                        history.append(ModelResponse(parts=[TextPart(content=content)]))
                    elif role == "system":
                        history.append(ModelRequest(parts=[SystemPromptPart(content=content)]))

            async with self._agent.iter(
                user_message,
                message_history=history,
            ) as run:
                async for node in run:
                    if isinstance(node, ModelRequestNode):
                        async with node.stream(run.ctx) as stream:
                            async for event in stream:
                                if isinstance(event, PartDeltaEvent) and isinstance(
                                    event.delta, TextPartDelta
                                ):
                                    yield StreamEvent(
                                        type="text_delta",
                                        data={"text": event.delta.content_delta},
                                    )
                    elif isinstance(node, CallToolsNode):
                        async with node.stream(run.ctx) as stream:
                            async for event in stream:
                                if isinstance(event, FunctionToolCallEvent):
                                    tool_name = event.part.tool_name
                                    try:
                                        args_str = json.dumps(event.part.args, ensure_ascii=False)
                                    except (TypeError, ValueError):
                                        args_str = str(event.part.args)
                                    yield StreamEvent(
                                        type="tool_call",
                                        data={
                                            "name": tool_name,
                                            "args": args_str,
                                            "status": "calling",
                                        },
                                    )
                                elif isinstance(event, FunctionToolResultEvent):
                                    tool_name = event.tool_name
                                    try:
                                        result_str = str(event.result.content)[:500]
                                    except Exception:
                                        result_str = "(result)"
                                    yield StreamEvent(
                                        type="tool_result",
                                        data={
                                            "name": tool_name,
                                            "result": result_str,
                                            "status": "done",
                                        },
                                    )

            yield StreamEvent(type="done", data={})

        except Exception as e:
            yield StreamEvent(type="error", data={"error": str(e)})

    async def generate_summary(self, prompt: str) -> str:
        """Use the model directly (without tools) to generate a summary."""
        summary_agent = Agent(self._model, system_prompt="You are a helpful summarizer.")
        result = await summary_agent.run(prompt)
        return str(result.output)

    async def generate_title(self, first_message: str) -> str:
        """Generate a short session title based on the first user message."""
        title_agent = Agent(
            self._model,
            system_prompt=(
                "Generate a very short title (max 6 words) for a conversation "
                "that starts with the following message. Return ONLY the title, "
                "nothing else."
            ),
        )
        result = await title_agent.run(first_message)
        title = str(result.output).strip().strip('"').strip("'")
        return title[:50]  # safety cap


def create_agent_from_env() -> ChatAgent:
    """Create a ChatAgent from environment variables (used by server.py)."""
    return ChatAgent(
        endpoint=os.environ.get("AI_CHAT_ENDPOINT", "https://api.openai.com/v1"),
        model_name=os.environ.get("AI_CHAT_MODEL", "gpt-4o"),
        api_key=os.environ.get("AI_CHAT_API_KEY", ""),
        mcp_command=os.environ.get("AI_CHAT_MCP_COMMAND", "remnote-bridge"),
        mcp_args=os.environ.get("AI_CHAT_MCP_ARGS", "mcp").split(),
        system_prompt=os.environ.get("AI_CHAT_SYSTEM_PROMPT", None),
    )
