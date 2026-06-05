"""
Entrypoint HTTP para el microservicio bot.
Usa http.server de la stdlib (sin dependencias externas).
"""

import json
import os
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.tienda_support_bot.service import BotService  # noqa: E402
from src.tienda_support_bot.store import MemorySessionStore  # noqa: E402

service = BotService(session_store=MemorySessionStore())


class BotHandler(BaseHTTPRequestHandler):
    def _send(self, status, data):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def _read_body(self):
        length = int(self.headers.get("Content-Length", 0))
        if length == 0:
            return {}
        return json.loads(self.rfile.read(length))

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_POST(self):
        path = urlparse(self.path).path
        body = self._read_body()
        auth = self.headers.get("Authorization", "")
        body["authorization"] = auth

        if path == "/messages":
            resp = service.process_message(body)
        elif path == "/confirm":
            resp = service.confirm_action(body)
        else:
            resp = {"error": "not_found"}
            self._send(404, resp)
            return

        self._send(200, resp)

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/health":
            self._send(200, {"status": "ok", "service": "bot-python"})
        else:
            self._send(404, {"error": "not_found"})


def main():
    port = int(os.environ.get("BOT_PORT", "8000"))
    server = HTTPServer(("0.0.0.0", port), BotHandler)
    print(f"Bot microservice listening on port {port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        server.server_close()


if __name__ == "__main__":
    main()
