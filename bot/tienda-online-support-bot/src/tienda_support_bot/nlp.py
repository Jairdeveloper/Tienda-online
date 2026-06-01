from __future__ import annotations

import re
from typing import Any


UUID_RE = re.compile(
    r"\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b"
)
SKU_RE = re.compile(r"\b[A-Z]{2,}[A-Z0-9-]{2,}\b")
NUMBER_RE = re.compile(r"\b\d+\b")
EMAIL_RE = re.compile(r"\b[\w.\-+]+@[\w.\-]+\.\w+\b")


class TextProcessor:
    def normalize(self, text: str) -> str:
        text = text.strip().lower()
        text = re.sub(r"\s+", " ", text)
        return text

    def tokenize(self, text: str) -> list[str]:
        return [token for token in re.split(r"[^a-zA-Z0-9@._-]+", text) if token]

    def extract_entities(self, raw_text: str, tokens: list[str]) -> dict[str, Any]:
        entities: dict[str, Any] = {}
        uuids = UUID_RE.findall(raw_text)
        skus = SKU_RE.findall(raw_text.upper())
        numbers = [int(value) for value in NUMBER_RE.findall(raw_text)]
        emails = EMAIL_RE.findall(raw_text)

        if uuids:
            entities["ids"] = uuids
        if skus:
            entities["sku"] = skus[0]
        if numbers:
            entities["numbers"] = numbers
            entities["quantity"] = numbers[-1]
        if emails:
            entities["email"] = emails[0]

        statuses = {"pending", "paid", "processing", "shipped", "delivered", "cancelled"}
        for token in tokens:
            if token in statuses:
                entities["order_status"] = token
                break
        return entities
