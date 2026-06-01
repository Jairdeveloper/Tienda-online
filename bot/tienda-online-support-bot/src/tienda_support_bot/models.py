from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class User:
    id: str | None
    email: str | None
    roles: list[str] = field(default_factory=list)
    permissions: list[str] = field(default_factory=list)
    is_anonymous: bool = True


@dataclass
class Message:
    role: str
    text: str
    created_at: str = field(default_factory=now_iso)
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class Intent:
    name: str
    confidence: float
    audience: str
    required_auth: bool = False
    required_roles: list[str] = field(default_factory=list)
    required_permissions: list[str] = field(default_factory=list)
    entities: dict[str, Any] = field(default_factory=dict)


@dataclass
class ContextItem:
    source: str
    title: str
    content: str
    trust_level: str = "medium"
    expires_at: str | None = None


@dataclass
class BotAction:
    type: str
    endpoint: str | None = None
    method: str | None = None
    payload: dict[str, Any] | None = None
    requires_confirmation: bool = False
    action_name: str | None = None
    required_roles: list[str] = field(default_factory=list)
    required_permissions: list[str] = field(default_factory=list)
    id: str = field(default_factory=lambda: str(uuid4()))
    expires_at: str | None = None


@dataclass
class BotState:
    session_id: str
    user: User = field(default_factory=lambda: User(None, None))
    roles: list[str] = field(default_factory=list)
    permissions: list[str] = field(default_factory=list)
    channel: str = "web"
    conversation: list[Message] = field(default_factory=list)
    context_window: list[ContextItem] = field(default_factory=list)
    active_intent: Intent | None = None
    pending_action: BotAction | None = None
    safety_flags: list[str] = field(default_factory=list)
    audit_trace: list[dict[str, Any]] = field(default_factory=list)
