MIN_CONFIDENCE = 0.62
API_PREFIX = "/api/v1"
CHANNEL = "web"

WRITE_ACTIONS = {
    "update_order",
    "update_inventory",
    "create_product",
    "update_product",
    "delete_product",
}

PUBLIC_INTENTS = {
    "catalog.search",
    "inventory.check",
    "fallback.clarify",
}
