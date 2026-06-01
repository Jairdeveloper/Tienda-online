from __future__ import annotations

from .constants import API_PREFIX
from .models import BotAction, ContextItem, Intent, User


class BotTools:
    def fetch_allowed_context(self, intent: Intent, user: User) -> list[ContextItem]:
        if intent.name == "catalog.search":
            sku = intent.entities.get("sku", "sin-sku")
            return [ContextItem("api", f"{API_PREFIX}/catalog/products", f"Busqueda de producto para SKU {sku}.", "high")]

        if intent.name == "inventory.check":
            sku = intent.entities.get("sku", "sin-sku")
            return [ContextItem("api", f"{API_PREFIX}/catalog/inventory/:variantId", f"Consulta de stock para {sku}.", "high")]

        if intent.name == "orders.my_status":
            return [ContextItem("api", f"{API_PREFIX}/orders", f"Consulta de pedidos propios para {user.email}.", "high")]

        if intent.name.startswith("admin."):
            return [ContextItem("api", f"{API_PREFIX}/admin", f"Contexto administrativo para {intent.name}.", "high")]

        return []

    def build_action(self, intent: Intent, context: list[ContextItem]) -> BotAction:
        if intent.name == "admin.inventory.update":
            return BotAction(
                type="draft_admin_change",
                endpoint=f"{API_PREFIX}/admin/inventory/:variantId",
                method="PATCH",
                payload={"entities": intent.entities},
                requires_confirmation=True,
                action_name="update_inventory",
                required_roles=intent.required_roles,
                required_permissions=intent.required_permissions,
            )

        if intent.name == "admin.orders.update_status":
            return BotAction(
                type="draft_admin_change",
                endpoint=f"{API_PREFIX}/admin/orders/:id/status",
                method="PATCH",
                payload={"entities": intent.entities},
                requires_confirmation=True,
                action_name="update_order",
                required_roles=intent.required_roles,
                required_permissions=intent.required_permissions,
            )

        if intent.name == "admin.products.manage":
            return BotAction(
                type="draft_admin_change",
                endpoint=f"{API_PREFIX}/admin/products",
                method="POST/PATCH/DELETE",
                payload={"entities": intent.entities},
                requires_confirmation=True,
                action_name="update_product",
                required_roles=intent.required_roles,
                required_permissions=intent.required_permissions,
            )

        return BotAction(type="answer", payload={"context_count": len(context)})

    def execute_read_or_answer(self, action: BotAction, context: list[ContextItem]) -> dict[str, str]:
        if action.type == "answer":
            return {"status": "ok", "mode": "answer"}
        return {"status": "ok", "mode": "read"}

    def execute_mutation(self, action: BotAction) -> dict[str, str]:
        return {
            "status": "executed",
            "action": action.action_name or "unknown",
            "endpoint": action.endpoint or "",
        }
