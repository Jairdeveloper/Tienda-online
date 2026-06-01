from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

from tienda_support_bot.service import BotService  # noqa: E402
from tienda_support_bot.store import JsonFileSessionStore  # noqa: E402


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Tienda online support bot demo")
    parser.add_argument("text", help="Mensaje del usuario")
    parser.add_argument("--session-id", default="demo-session")
    parser.add_argument("--auth", default=None, help="Bearer token o demo-admin/demo-customer")
    parser.add_argument("--confirm", action="store_true", help="Procesar como confirmacion")
    return parser


def main() -> None:
    args = build_parser().parse_args()
    service = BotService(session_store=JsonFileSessionStore(ROOT / ".sessions"))
    authorization = args.auth
    if authorization and not authorization.lower().startswith("bearer "):
        authorization = f"Bearer {authorization}"

    request = {
        "text": args.text,
        "sessionId": args.session_id,
        "authorization": authorization,
        "route": "cli",
    }
    if args.confirm:
        response = service.confirm_action(request)
    else:
        response = service.process_message(request)

    print(json.dumps(response, indent=2, ensure_ascii=True))


if __name__ == "__main__":
    main()
