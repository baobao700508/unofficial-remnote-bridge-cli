"""Context management — truncation and summarization for chat history.

Strategies:
1. Token estimation: chars / 4 (good enough for mixed CJK/English)
2. When message count exceeds summary_threshold, old messages are compressed
   into a summary via LLM call
3. Final context = [system_prompt, summary (if any), recent messages]
   capped at max_history_tokens
"""

from __future__ import annotations

from dataclasses import dataclass

from .storage import Message


def estimate_tokens(text: str) -> int:
    """Rough token estimate — 1 token per ~4 chars (works for mixed CJK/English)."""
    return max(1, len(text) // 4)


@dataclass
class PreparedContext:
    """Messages ready to send to the LLM."""

    messages: list[dict[str, str]]  # [{"role": ..., "content": ...}, ...]
    total_tokens: int
    was_truncated: bool
    summary_used: bool


class ContextManager:
    """Prepares chat context with truncation and summarization."""

    def __init__(
        self,
        system_prompt: str,
        max_history_tokens: int = 8000,
        summary_threshold: int = 20,
    ) -> None:
        self._system_prompt = system_prompt
        self._max_history_tokens = max_history_tokens
        self._summary_threshold = summary_threshold

    def prepare_messages(
        self,
        history: list[Message],
        existing_summary: str | None = None,
    ) -> PreparedContext:
        """Build the message list for the LLM, truncating as needed.

        Returns PreparedContext with the final message list and metadata.
        Does NOT call the LLM for summarization — that's done separately
        by the caller when needs_summary() returns True.
        """
        result: list[dict[str, str]] = []
        system_tokens = estimate_tokens(self._system_prompt)
        budget = self._max_history_tokens - system_tokens

        # Add system prompt
        result.append({"role": "system", "content": self._system_prompt})

        summary_used = False
        was_truncated = False

        # If we have an existing summary, prepend it
        if existing_summary:
            summary_tokens = estimate_tokens(existing_summary)
            if summary_tokens < budget:
                result.append({
                    "role": "system",
                    "content": f"Previous conversation summary:\n{existing_summary}",
                })
                budget -= summary_tokens
                summary_used = True

        # Add messages from most recent backwards until budget exhausted
        reversed_msgs: list[dict[str, str]] = []
        used_tokens = 0

        for msg in reversed(history):
            msg_tokens = estimate_tokens(msg.content)
            if used_tokens + msg_tokens > budget:
                was_truncated = True
                break
            reversed_msgs.append({"role": msg.role, "content": msg.content})
            used_tokens += msg_tokens

        # Reverse back to chronological order
        reversed_msgs.reverse()
        result.extend(reversed_msgs)

        total = system_tokens + used_tokens
        if summary_used and existing_summary:
            total += estimate_tokens(existing_summary)

        return PreparedContext(
            messages=result,
            total_tokens=total,
            was_truncated=was_truncated,
            summary_used=summary_used,
        )

    def needs_summary(self, message_count: int, existing_summary: str | None) -> bool:
        """Check if the session needs a new summary generated."""
        if message_count < self._summary_threshold:
            return False
        # Re-summarize every summary_threshold messages
        return message_count % self._summary_threshold == 0

    def build_summary_prompt(
        self,
        messages: list[Message],
        existing_summary: str | None = None,
    ) -> str:
        """Build a prompt asking the LLM to summarize conversation history.

        The caller should send this to the LLM and store the result.
        """
        parts: list[str] = []

        if existing_summary:
            parts.append(f"Previous summary:\n{existing_summary}\n")

        parts.append("Recent conversation to summarize:")
        for msg in messages:
            role_label = "User" if msg.role == "user" else "Assistant"
            # Truncate very long messages in the summary input
            content = msg.content[:2000] if len(msg.content) > 2000 else msg.content
            parts.append(f"{role_label}: {content}")

        parts.append(
            "\nPlease provide a concise summary (under 200 words) of the key points, "
            "decisions, and context from this conversation. Focus on information "
            "that would be useful for continuing the conversation."
        )

        return "\n".join(parts)
