from __future__ import annotations

import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from .constants import API_PREFIX
from .models import BotAction, ContextItem, Intent, User

# URL base de la API NestJS (sin /api/v1 — API_PREFIX lo agrega)
API_BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:3000")


class BotTools:
    # ── helpers HTTP ──────────────────────────────────────────────

    def _request(
        self,
        method: str,
        endpoint: str,
        token: str | None = None,
        payload: dict | None = None,
    ) -> dict:
        """Make an HTTP request to the NestJS API and return parsed JSON."""
        url = f"{API_BASE_URL}{endpoint}"
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        data = json.dumps(payload).encode() if payload is not None else None
        req = Request(url, data=data, headers=headers, method=method)
        try:
            with urlopen(req, timeout=10) as resp:
                body = resp.read().decode()
                return json.loads(body) if body else {"status": "ok"}
        except HTTPError as e:
            error_body = e.read().decode() if e.fp else ""
            try:
                detail = json.loads(error_body)
            except (json.JSONDecodeError, ValueError):
                detail = {"message": e.reason}
            return {
                "error": f"HTTP {e.code}",
                "status": "error",
                "detail": detail,
            }
        except URLError as e:
            return {
                "error": f"Connection error: {e.reason}",
                "status": "error",
            }
        except TimeoutError:
            return {
                "error": "Request timed out after 10s",
                "status": "error",
            }
        except Exception as e:
            return {
                "error": f"Unexpected error: {str(e)}",
                "status": "error",
            }

    def _get(self, endpoint: str, token: str | None = None) -> dict:
        return self._request("GET", endpoint, token=token)

    # ── fetch_allowed_context ─────────────────────────────────────

    def fetch_allowed_context(self, intent: Intent, user: User) -> list[ContextItem]:
        token = user.token if user and not user.is_anonymous else None

        if intent.name == "catalog.search":
            sku = intent.entities.get("sku", "")
            qs = f"search={sku}" if sku else ""
            endpoint = f"{API_PREFIX}/catalog/products{'?' + qs if qs else ''}"
            data = self._get(endpoint, token=token)
            if data.get("status") == "error":
                return [
                    ContextItem(
                        "api",
                        endpoint,
                        f"No se pudo consultar el catalogo: {data.get('error', 'error desconocido')}",
                        "low",
                    )
                ]
            return [ContextItem("api", endpoint, json.dumps(data), "high")]

        if intent.name == "catalog.product_detail":
            product_id = intent.entities.get("productId", intent.entities.get("sku", ""))
            endpoint = f"{API_PREFIX}/catalog/products/{product_id}"
            data = self._get(endpoint, token=token)
            if data.get("status") == "error":
                return [
                    ContextItem(
                        "api",
                        endpoint,
                        f"No se pudo consultar el producto: {data.get('error', 'error desconocido')}",
                        "low",
                    )
                ]
            return [ContextItem("api", endpoint, json.dumps(data), "high")]

        if intent.name == "inventory.check":
            variant_id = intent.entities.get("variantId", intent.entities.get("sku", ""))
            endpoint = f"{API_PREFIX}/catalog/inventory/{variant_id}"
            data = self._get(endpoint, token=token)
            if data.get("status") == "error":
                return [
                    ContextItem(
                        "api",
                        endpoint,
                        f"No se pudo consultar el inventario: {data.get('error', 'error desconocido')}",
                        "low",
                    )
                ]
            return [ContextItem("api", endpoint, json.dumps(data), "high")]

        if intent.name == "orders.my_status":
            endpoint = f"{API_PREFIX}/orders"
            data = self._get(endpoint, token=token)
            if data.get("status") == "error":
                return [
                    ContextItem(
                        "api",
                        endpoint,
                        f"No se pudieron consultar los pedidos: {data.get('error', 'error desconocido')}",
                        "low",
                    )
                ]
            return [ContextItem("api", endpoint, json.dumps(data), "high")]

        if intent.name == "admin.orders.search":
            endpoint = f"{API_PREFIX}/admin/orders"
            data = self._get(endpoint, token=token)
            if data.get("status") == "error":
                return [
                    ContextItem(
                        "api",
                        endpoint,
                        f"No se pudieron consultar pedidos admin: {data.get('error', 'error desconocido')}",
                        "low",
                    )
                ]
            return [ContextItem("api", endpoint, json.dumps(data), "high")]

        if intent.name.startswith("admin."):
            return [
                ContextItem(
                    "api",
                    f"{API_PREFIX}/admin",
                    f"Contexto administrativo para {intent.name}.",
                    "high",
                )
            ]

        return []

    # ── build_action ──────────────────────────────────────────────

    def build_action(self, intent: Intent, context: list[ContextItem]) -> BotAction:
        if intent.name == "admin.inventory.update":
            variant_id = intent.entities.get("variantId", intent.entities.get("sku", ""))
            endpoint = f"{API_PREFIX}/admin/inventory/{variant_id}"
            return BotAction(
                type="draft_admin_change",
                endpoint=endpoint,
                method="PATCH",
                payload={"entities": intent.entities},
                requires_confirmation=True,
                action_name="update_inventory",
                required_roles=intent.required_roles,
                required_permissions=intent.required_permissions,
            )

        if intent.name == "admin.orders.update_status":
            order_id = intent.entities.get("orderId", "")
            endpoint = f"{API_PREFIX}/admin/orders/{order_id}/status"
            return BotAction(
                type="draft_admin_change",
                endpoint=endpoint,
                method="PATCH",
                payload={"entities": intent.entities},
                requires_confirmation=True,
                action_name="update_order",
                required_roles=intent.required_roles,
                required_permissions=intent.required_permissions,
            )

        if intent.name == "admin.products.manage":
            endpoint = f"{API_PREFIX}/admin/products"
            return BotAction(
                type="draft_admin_change",
                endpoint=endpoint,
                method="POST",
                payload={"entities": intent.entities},
                requires_confirmation=True,
                action_name="create_product",
                required_roles=intent.required_roles,
                required_permissions=intent.required_permissions,
            )

        if intent.name == "admin.variants.manage":
            product_id = intent.entities.get("productId", "")
            endpoint = f"{API_PREFIX}/admin/products/{product_id}/variants"
            return BotAction(
                type="draft_admin_change",
                endpoint=endpoint,
                method="POST",
                payload={"entities": intent.entities},
                requires_confirmation=True,
                action_name="create_variant",
                required_roles=intent.required_roles,
                required_permissions=intent.required_permissions,
            )

        if intent.name.startswith("admin."):
            return BotAction(
                type="draft_admin_change",
                endpoint=f"{API_PREFIX}/admin",
                method="PATCH",
                payload={"entities": intent.entities},
                requires_confirmation=True,
                action_name=intent.name.removeprefix("admin."),
                required_roles=intent.required_roles,
                required_permissions=intent.required_permissions,
            )

        return BotAction(type="answer", payload={"context_count": len(context)})

    # ── execute_read_or_answer ────────────────────────────────────

    def execute_read_or_answer(
        self,
        action: BotAction,
        context: list[ContextItem],
        user: User | None = None,
    ) -> dict:
        if action.type == "answer":
            return {"status": "ok", "mode": "answer"}

        # For draft_admin_change or read actions, fetch current data
        token = user.token if user and not user.is_anonymous else None
        if action.endpoint:
            data = self._get(action.endpoint, token=token)
            if data.get("status") == "error":
                return {"status": "error", "mode": "read", "error": data.get("error", "")}
            return {"status": "ok", "mode": "read", "data": data}

        return {"status": "ok", "mode": "read"}

    # ── execute_mutation ──────────────────────────────────────────

    def execute_mutation(self, action: BotAction, user: User | None = None) -> dict:
        token = user.token if user and not user.is_anonymous else None
        method = action.method or "PATCH"
        endpoint = action.endpoint or ""

        if not endpoint:
            return {
                "status": "error",
                "action": action.action_name or "unknown",
                "error": "No endpoint specified in action",
            }

        data = self._request(method, endpoint, token=token, payload=action.payload)
        if data.get("status") == "error":
            return {
                "status": "error",
                "action": action.action_name or "unknown",
                "endpoint": endpoint,
                "error": data.get("error", ""),
                "detail": data.get("detail", ""),
            }

        return {
            "status": "executed",
            "action": action.action_name or "unknown",
            "endpoint": endpoint,
            "data": data,
        }
