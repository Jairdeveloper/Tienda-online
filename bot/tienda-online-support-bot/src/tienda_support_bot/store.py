from __future__ import annotations

import json
from dataclasses import asdict
from pathlib import Path
from typing import Any

from .models import BotAction, BotState, ContextItem, Intent, Message, User


class MemorySessionStore:
    """In-memory session storage for the first Python base."""

    def __init__(self) -> None:
        self._states: dict[str, BotState] = {}

    def load_or_create(self, session_id: str) -> BotState:
        if session_id not in self._states:
            self._states[session_id] = BotState(session_id=session_id)
        return self._states[session_id]

    def save(self, state: BotState) -> None:
        self._states[state.session_id] = state


class JsonFileSessionStore:
    """Small JSON storage for CLI demos and local development."""

    def __init__(self, directory: str | Path) -> None:
        self.directory = Path(directory)
        self.directory.mkdir(parents=True, exist_ok=True)

    def load_or_create(self, session_id: str) -> BotState:
        path = self._path(session_id)
        if not path.exists():
            return BotState(session_id=session_id)
        data = json.loads(path.read_text(encoding="utf-8"))
        return self._dict_to_state(data)

    def save(self, state: BotState) -> None:
        path = self._path(state.session_id)
        path.write_text(json.dumps(asdict(state), indent=2, ensure_ascii=True), encoding="utf-8")

    def _path(self, session_id: str) -> Path:
        safe = "".join(char for char in session_id if char.isalnum() or char in ("-", "_"))
        return self.directory / f"{safe or 'anonymous'}.json"

    def _dict_to_state(self, data: dict[str, Any]) -> BotState:
        user = User(**data.get("user", {"id": None, "email": None}))
        conversation = [Message(**item) for item in data.get("conversation", [])]
        context_window = [ContextItem(**item) for item in data.get("context_window", [])]

        active_data = data.get("active_intent")
        active_intent = Intent(**active_data) if active_data else None

        pending_data = data.get("pending_action")
        pending_action = BotAction(**pending_data) if pending_data else None

        return BotState(
            session_id=data["session_id"],
            user=user,
            roles=list(data.get("roles", [])),
            permissions=list(data.get("permissions", [])),
            channel=data.get("channel", "web"),
            conversation=conversation,
            context_window=context_window,
            active_intent=active_intent,
            pending_action=pending_action,
            safety_flags=list(data.get("safety_flags", [])),
            audit_trace=list(data.get("audit_trace", [])),
        )
