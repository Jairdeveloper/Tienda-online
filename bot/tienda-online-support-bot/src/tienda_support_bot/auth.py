from __future__ import annotations

import base64
import json
from typing import Any

from .models import User


class AuthResolver:
    """Resolve a user from Authorization data.

    The demo supports:
    - Bearer demo-admin
    - Bearer demo-customer
    - Bearer <jwt>, decoded without signature validation for scaffolding only.
    """

    def resolve(self, authorization: str | None) -> User:
        if not authorization:
            return User(id=None, email=None, is_anonymous=True)

        token = authorization.removeprefix("Bearer ").strip()
        if token == "demo-admin":
            return User(
                id="demo-admin",
                email="admin@tienda.local",
                roles=["admin"],
                permissions=[
                    "products:read",
                    "products:write",
                    "orders:read",
                    "orders:write",
                    "inventory:read",
                    "inventory:write",
                    "payments:read",
                ],
                is_anonymous=False,
            )
        if token == "demo-customer":
            return User(
                id="demo-customer",
                email="customer@tienda.local",
                roles=["customer"],
                permissions=["products:read"],
                is_anonymous=False,
            )

        payload = self._decode_jwt_payload(token)
        if not payload:
            return User(id=None, email=None, is_anonymous=True)
        return User(
            id=str(payload.get("sub")) if payload.get("sub") else None,
            email=payload.get("email"),
            roles=list(payload.get("roles", [])),
            permissions=list(payload.get("permissions", [])),
            is_anonymous=False,
        )

    def _decode_jwt_payload(self, token: str) -> dict[str, Any] | None:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        payload = parts[1]
        padded = payload + "=" * (-len(payload) % 4)
        try:
            decoded = base64.urlsafe_b64decode(padded.encode("ascii"))
            return json.loads(decoded.decode("utf-8"))
        except (ValueError, json.JSONDecodeError):
            return None
