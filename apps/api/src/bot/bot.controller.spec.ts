import type { Request } from "express";
import { BotController } from "./bot.controller";
import { BotService } from "./bot.service";
import type { AuthenticatedUser } from "../auth/decorators/current-user.decorator";

describe("BotController", () => {
  let controller: BotController;
  let mockService: BotService;
  const mockUser: AuthenticatedUser = {
    id: "test-user",
    email: "test@tienda.local",
    roles: ["customer"],
    permissions: ["products:read"],
  };
  const mockReq = {
    headers: { authorization: "Bearer test.jwt.token" },
  } as Request;

  beforeEach(() => {
    mockService = {
      processMessage: jest.fn().mockResolvedValue({
        sessionId: "sess-1",
        reply: "Respuesta del bot",
        intent: "catalog.search",
        requiresConfirmation: false,
        sources: [{ type: "api", title: "Productos" }],
        requestId: "req-1",
      }),
      confirmAction: jest.fn().mockResolvedValue({
        sessionId: "sess-1",
        reply: "Accion ejecutada",
        intent: "admin.inventory.update",
        requiresConfirmation: false,
        sources: [],
        requestId: "req-2",
      }),
      getStatus: jest.fn().mockResolvedValue({ status: "ok" }),
    } as any;
    controller = new BotController(mockService);
  });

  it("should process a message", async () => {
    const result = await controller.sendMessage(
      { text: "buscar producto SKU ABC-1" },
      mockUser,
      mockReq,
    );
    expect(result.reply).toBe("Respuesta del bot");
    expect(result.intent).toBe("catalog.search");
    expect(mockService.processMessage).toHaveBeenCalledWith(
      "buscar producto SKU ABC-1",
      undefined,
      mockUser,
      "test.jwt.token",
      undefined,
    );
  });

  it("should confirm an action", async () => {
    const result = await controller.confirmAction(
      { text: "confirmo", sessionId: "sess-1" },
      mockUser,
      mockReq,
    );
    expect(result.reply).toBe("Accion ejecutada");
    expect(mockService.confirmAction).toHaveBeenCalledWith(
      "confirmo",
      "sess-1",
      mockUser,
      "test.jwt.token",
    );
  });

  it("should return bot status", async () => {
    const result = await controller.getStatus();
    expect(result.status).toBe("ok");
    expect(mockService.getStatus).toHaveBeenCalled();
  });
});
