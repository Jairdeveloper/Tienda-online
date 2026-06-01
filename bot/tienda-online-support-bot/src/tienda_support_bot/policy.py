from __future__ import annotations

from .models import Intent, User


class BotPolicy:
    def is_authorized(self, user: User, intent: Intent) -> bool:
        if intent.required_auth and user.is_anonymous:
            return False
        if intent.required_roles and not set(intent.required_roles).issubset(set(user.roles)):
            return False
        if intent.required_permissions and not set(intent.required_permissions).issubset(set(user.permissions)):
            return False
        return True

    def requires_login(self, user: User, intent: Intent) -> bool:
        return intent.required_auth and user.is_anonymous

    def is_explicit_confirmation(self, text: str) -> bool:
        normalized = text.strip().lower()
        return normalized in {"confirmo", "confirmar", "si confirmo", "acepto", "ejecutar"}
