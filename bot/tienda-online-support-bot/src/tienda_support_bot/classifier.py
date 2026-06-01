from __future__ import annotations

from typing import Any

from .models import BotState, Intent


class IntentClassifier:
    def classify(self, tokens: list[str], entities: dict[str, Any], state: BotState) -> Intent:
        words = set(tokens)
        text = " ".join(tokens)

        if {"inventario", "stock", "disponible"} & words:
            if {"actualizar", "ajustar", "cambiar"} & words:
                return Intent(
                    "admin.inventory.update",
                    0.91,
                    "admin",
                    True,
                    ["admin"],
                    ["inventory:write"],
                    entities,
                )
            return Intent("inventory.check", 0.86, "reseller", False, [], [], entities)

        if {"producto", "catalogo", "sku", "buscar"} & words or "sku" in entities:
            if {"crear", "editar", "desactivar", "eliminar"} & words:
                return Intent(
                    "admin.products.manage",
                    0.9,
                    "admin",
                    True,
                    ["admin"],
                    ["products:write"],
                    entities,
                )
            return Intent("catalog.search", 0.84, "reseller", False, [], [], entities)

        if {"pedido", "orden", "estado"} & words:
            if {"cambiar", "actualizar"} & words:
                return Intent(
                    "admin.orders.update_status",
                    0.9,
                    "admin",
                    True,
                    ["admin"],
                    ["orders:write"],
                    entities,
                )
            return Intent("orders.my_status", 0.78, "reseller", True, [], ["orders:read"], entities)

        if {"carrito", "checkout", "pago", "direccion"} & words:
            return Intent("cart.help", 0.76, "reseller", True, [], [], entities)

        if {"api", "permiso", "rol", "jwt", "documentacion"} & words:
            return Intent("docs.technical_help", 0.81, "operator", True, ["admin"], [], entities)

        if state.active_intent:
            return Intent(
                state.active_intent.name,
                0.65,
                state.active_intent.audience,
                state.active_intent.required_auth,
                state.active_intent.required_roles,
                state.active_intent.required_permissions,
                entities,
            )

        return Intent("fallback.clarify", 0.45, "anonymous", False, [], [], entities)
