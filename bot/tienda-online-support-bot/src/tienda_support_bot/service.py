from __future__ import annotations

from typing import Any
from uuid import uuid4

from .auth import AuthResolver
from .classifier import IntentClassifier
from .constants import CHANNEL, MIN_CONFIDENCE
from .knowledge import BotKnowledge
from .models import BotAction, BotState, ContextItem, Intent, Message
from .nlp import TextProcessor
from .policy import BotPolicy
from .store import MemorySessionStore
from .tools import BotTools


class BotService:
    def __init__(
        self,
        session_store: MemorySessionStore | None = None,
        auth_resolver: AuthResolver | None = None,
        text_processor: TextProcessor | None = None,
        classifier: IntentClassifier | None = None,
        policy: BotPolicy | None = None,
        knowledge: BotKnowledge | None = None,
        tools: BotTools | None = None,
    ) -> None:
        self.session_store = session_store or MemorySessionStore()
        self.auth_resolver = auth_resolver or AuthResolver()
        self.text_processor = text_processor or TextProcessor()
        self.classifier = classifier or IntentClassifier()
        self.policy = policy or BotPolicy()
        self.knowledge = knowledge or BotKnowledge()
        self.tools = tools or BotTools()

    def process_message(self, request: dict[str, Any]) -> dict[str, Any]:
        request_id = str(uuid4())
        state = self._load_state(request)
        raw_text = str(request.get("text", ""))
        state.conversation.append(Message(role="user", text=raw_text, metadata={"requestId": request_id}))

        normalized = self.text_processor.normalize(raw_text)
        tokens = self.text_processor.tokenize(normalized)
        entities = self.text_processor.extract_entities(raw_text, tokens)
        intent = self.classifier.classify(tokens, entities, state)
        state.active_intent = intent

        if intent.confidence < MIN_CONFIDENCE:
            return self._ask_clarification(state, intent, request_id)

        if self.policy.requires_login(state.user, intent):
            return self._require_login(state, intent, request_id)

        if not self.policy.is_authorized(state.user, intent):
            return self._deny_safe(state, intent, request_id)

        context = self._resolve_context(intent, tokens, state)
        action = self.tools.build_action(intent, context)

        if action.requires_confirmation:
            state.pending_action = action
            self.session_store.save(state)
            return self._request_confirmation(state, intent, action, context, request_id)

        result = self.tools.execute_read_or_answer(action, context)
        reply = self._compose_answer(intent, context, result)
        return self._finalize(state, intent, context, reply, request_id, result)

    def confirm_action(self, request: dict[str, Any]) -> dict[str, Any]:
        request_id = str(uuid4())
        state = self._load_state(request)
        action = state.pending_action
        if action is None:
            return self._plain_response(state, "No hay una accion pendiente vigente.", "bot.confirm.none", request_id)

        intent = Intent(
            name=action.action_name or "pending.action",
            confidence=1.0,
            audience="admin",
            required_auth=True,
            required_roles=action.required_roles,
            required_permissions=action.required_permissions,
        )
        if not self.policy.is_authorized(state.user, intent):
            return self._deny_safe(state, intent, request_id)

        text = str(request.get("text", ""))
        if not self.policy.is_explicit_confirmation(text):
            state.pending_action = None
            self.session_store.save(state)
            return self._plain_response(state, "Accion cancelada.", "bot.confirm.cancelled", request_id)

        result = self.tools.execute_mutation(action)
        state.pending_action = None
        state.audit_trace.append({"requestId": request_id, "action": action.action_name, "result": result})
        self.session_store.save(state)
        return self._plain_response(state, f"Accion ejecutada: {result['action']}.", "bot.confirm.executed", request_id)

    def _load_state(self, request: dict[str, Any]) -> BotState:
        session_id = str(request.get("sessionId") or "anonymous")
        state = self.session_store.load_or_create(session_id)
        user = self.auth_resolver.resolve(request.get("authorization"))
        state.user = user
        state.roles = user.roles
        state.permissions = user.permissions
        state.channel = CHANNEL
        return state

    def _resolve_context(self, intent: Intent, tokens: list[str], state: BotState) -> list[ContextItem]:
        if intent.name.startswith(("catalog.", "inventory.", "orders.", "admin.")):
            return self.tools.fetch_allowed_context(intent, state.user)
        return self.knowledge.retrieve(intent, tokens)

    def _compose_answer(self, intent: Intent, context: list[ContextItem], result: dict[str, str]) -> str:
        if intent.name == "catalog.search":
            return f"Prepare una busqueda de catalogo. Fuente: {context[0].title}."
        if intent.name == "inventory.check":
            return f"Prepare una consulta de inventario. Fuente: {context[0].title}."
        if intent.name == "orders.my_status":
            return "Puedo consultar pedidos propios con la sesion autenticada."
        if intent.name == "docs.technical_help":
            return context[0].content
        return "Puedo ayudarte con catalogo, inventario, carrito, pedidos, pagos o administracion."

    def _request_confirmation(
        self,
        state: BotState,
        intent: Intent,
        action: BotAction,
        context: list[ContextItem],
        request_id: str,
    ) -> dict[str, Any]:
        reply = f"Accion administrativa preparada: {action.action_name}. Confirma para ejecutar."
        return self._finalize(state, intent, context, reply, request_id, {"status": "pending_confirmation"}, action)

    def _ask_clarification(self, state: BotState, intent: Intent, request_id: str) -> dict[str, Any]:
        return self._plain_response(state, "Necesito mas informacion para clasificar la solicitud.", intent.name, request_id)

    def _require_login(self, state: BotState, intent: Intent, request_id: str) -> dict[str, Any]:
        return self._plain_response(state, "Debes iniciar sesion para continuar con esta solicitud.", intent.name, request_id)

    def _deny_safe(self, state: BotState, intent: Intent, request_id: str) -> dict[str, Any]:
        return self._plain_response(state, "No tienes permisos suficientes para esta accion.", intent.name, request_id)

    def _plain_response(self, state: BotState, reply: str, intent_name: str, request_id: str) -> dict[str, Any]:
        state.conversation.append(Message(role="assistant", text=reply, metadata={"requestId": request_id}))
        self.session_store.save(state)
        return {
            "sessionId": state.session_id,
            "reply": reply,
            "intent": intent_name,
            "requiresConfirmation": False,
            "pendingActionId": None,
            "sources": [],
            "requestId": request_id,
        }

    def _finalize(
        self,
        state: BotState,
        intent: Intent,
        context: list[ContextItem],
        reply: str,
        request_id: str,
        result: dict[str, Any],
        action: BotAction | None = None,
    ) -> dict[str, Any]:
        state.context_window = context
        state.conversation.append(Message(role="assistant", text=reply, metadata={"requestId": request_id}))
        state.audit_trace.append({"requestId": request_id, "intent": intent.name, "result": result})
        self.session_store.save(state)
        return {
            "sessionId": state.session_id,
            "reply": reply,
            "intent": intent.name,
            "requiresConfirmation": bool(action and action.requires_confirmation),
            "pendingActionId": action.id if action and action.requires_confirmation else None,
            "sources": [{"type": item.source, "title": item.title} for item in context],
            "requestId": request_id,
        }
