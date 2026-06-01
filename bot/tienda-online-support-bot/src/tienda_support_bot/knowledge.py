from __future__ import annotations

from .models import ContextItem, Intent


class BotKnowledge:
    def retrieve(self, intent: Intent, tokens: list[str]) -> list[ContextItem]:
        if intent.name == "docs.technical_help":
            return [
                ContextItem(
                    "docs",
                    "Seguridad JWT/RBAC",
                    "Todas las rutas requieren JWT por defecto salvo @Public(). Admin usa rol admin.",
                    "high",
                )
            ]
        if intent.name == "cart.help":
            return [
                ContextItem(
                    "rules",
                    "Ayuda de carrito",
                    "El carrito requiere sesion de usuario y permite agregar, actualizar, quitar y limpiar items.",
                    "medium",
                )
            ]
        return [
            ContextItem(
                "rules",
                "Soporte general",
                "El bot solicita aclaracion cuando no detecta intent o entidades suficientes.",
                "medium",
            )
        ]
