import { HttpService } from "@nestjs/axios";
import { ServiceUnavailableException } from "@nestjs/common";
import { of, throwError } from "rxjs";
import { BotService } from "./bot.service";
import type { AuthenticatedUser } from "../auth/decorators/current-user.decorator";

describe("BotService", () => {
  let service: BotService;
  let httpService: HttpService;
  const mockUser: AuthenticatedUser = {
    id: "test-user",
    email: "test@tienda.local",
    roles: ["customer"],
    permissions: ["products:read"],
  };

  beforeEach(() => {
    httpService = {
      post: jest.fn(),
      get: jest.fn(),
    } as any;
    service = new BotService(httpService, {
      serviceUrl: "http://bot:8000",
      enabled: true,
    });
  });

  describe("processMessage", () => {
    it("should proxy message to Python microservice", async () => {
      const botResponse = {
        sessionId: "sess-1",
        reply: "Busqueda de catalogo",
        intent: "catalog.search",
        requiresConfirmation: false,
        sources: [{ type: "api", title: "Productos" }],
        requestId: "req-1",
      };
      (httpService.post as jest.Mock).mockReturnValueOnce(
        of({ data: botResponse }),
      );

      const result = await service.processMessage(
        "buscar ABC-1",
        "sess-1",
        mockUser,
        "my.jwt.token",
      );
      expect(result).toEqual(botResponse);
      expect(httpService.post).toHaveBeenCalledWith(
        "http://bot:8000/messages",
        {
          text: "buscar ABC-1",
          sessionId: "sess-1",
          authorization: "Bearer my.jwt.token",
          context: undefined,
          channel: "web",
        },
      );
    });

    it("should throw 503 when Python is down", async () => {
      (httpService.post as jest.Mock).mockReturnValueOnce(
        throwError(() => new Error("connection refused")),
      );
      await expect(
        service.processMessage("test", "sess-1", mockUser, "jwt"),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe("confirmAction", () => {
    it("should proxy confirmation to Python", async () => {
      const botResponse = {
        sessionId: "sess-1",
        reply: "Accion ejecutada",
        intent: "admin.inventory.update",
        requiresConfirmation: false,
        sources: [],
        requestId: "req-2",
      };
      (httpService.post as jest.Mock).mockReturnValueOnce(
        of({ data: botResponse }),
      );

      const result = await service.confirmAction(
        "confirmo",
        "sess-1",
        mockUser,
        "admin.jwt.token",
      );
      expect(result).toEqual(botResponse);
      expect(httpService.post).toHaveBeenCalledWith(
        "http://bot:8000/confirm",
        {
          text: "confirmo",
          sessionId: "sess-1",
          authorization: "Bearer admin.jwt.token",
        },
      );
    });

    it("should throw 503 when Python is down", async () => {
      (httpService.post as jest.Mock).mockReturnValueOnce(
        throwError(() => new Error("timeout")),
      );
      await expect(
        service.confirmAction("confirmo", "sess-1", mockUser, "jwt"),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe("getStatus", () => {
    it("should return ok when Python health responds", async () => {
      (httpService.get as jest.Mock).mockReturnValueOnce(
        of({ data: { status: "ok", service: "bot-python" } }),
      );
      const result = await service.getStatus();
      expect(result).toEqual({ status: "ok" });
    });

    it("should return unavailable when Python is down", async () => {
      (httpService.get as jest.Mock).mockReturnValueOnce(
        throwError(() => new Error("connection refused")),
      );
      const result = await service.getStatus();
      expect(result).toEqual({ status: "unavailable" });
    });
  });

  describe("disabled service", () => {
    beforeEach(() => {
      service = new BotService(httpService, {
        serviceUrl: "http://bot:8000",
        enabled: false,
      });
    });

    it("should throw 503 on processMessage", async () => {
      await expect(
        service.processMessage("test", "sess-1", mockUser, "jwt"),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it("should return disabled status", async () => {
      const result = await service.getStatus();
      expect(result).toEqual({ status: "disabled" });
    });
  });
});
