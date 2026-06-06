import client from "./client";

export interface BotResponse {
  sessionId: string;
  reply: string;
  intent: string;
  requiresConfirmation: boolean;
  pendingActionId: string | null;
  sources: { type: string; title: string }[];
  requestId: string;
}

export async function sendBotMessage(
  text: string,
  sessionId: string,
  context?: Record<string, unknown>,
): Promise<BotResponse> {
  const { data } = await client.post<BotResponse>("/bot/messages", {
    text,
    sessionId,
    context,
  });
  return data;
}

export async function confirmBotAction(
  sessionId: string,
  text?: string,
): Promise<BotResponse> {
  const { data } = await client.post<BotResponse>("/bot/confirm", {
    sessionId,
    text,
  });
  return data;
}

export async function getBotStatus(): Promise<{ status: string }> {
  const { data } = await client.get<{ status: string }>("/bot/status");
  return data;
}
