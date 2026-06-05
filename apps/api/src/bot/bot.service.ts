import { HttpService } from "@nestjs/axios";
import {
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import type { AuthenticatedUser } from "../auth/decorators/current-user.decorator";
import botConfig from "./config/bot.config";
import type { BotResponseDto } from "./dto/bot-response.dto";

@Injectable()
export class BotService {
  private readonly botUrl: string;
  private readonly enabled: boolean;

  constructor(
    private readonly httpService: HttpService,
    config: ConfigType<typeof botConfig>,
  ) {
    this.botUrl = config.serviceUrl;
    this.enabled = config.enabled;
  }

  async processMessage(
    text: string,
    sessionId: string | undefined,
    user: AuthenticatedUser,
    jwt: string,
    context?: Record<string, unknown>,
  ): Promise<BotResponseDto> {
    if (!this.enabled) {
      throw new ServiceUnavailableException("Bot service is disabled");
    }

    try {
      const { data } = await firstValueFrom(
        this.httpService.post(`${this.botUrl}/messages`, {
          text,
          sessionId: sessionId || `web-${user.id}`,
          authorization: `Bearer ${jwt}`,
          context,
          channel: "web",
        }),
      );
      return data;
    } catch {
      throw new ServiceUnavailableException(
        "Bot service is not available",
      );
    }
  }

  async confirmAction(
    text: string | undefined,
    sessionId: string,
    user: AuthenticatedUser,
    jwt: string,
  ): Promise<BotResponseDto> {
    if (!this.enabled) {
      throw new ServiceUnavailableException("Bot service is disabled");
    }

    try {
      const { data } = await firstValueFrom(
        this.httpService.post(`${this.botUrl}/confirm`, {
          text: text || "",
          sessionId,
          authorization: `Bearer ${jwt}`,
        }),
      );
      return data;
    } catch {
      throw new ServiceUnavailableException(
        "Bot service is not available",
      );
    }
  }

  async getStatus(): Promise<{ status: string }> {
    if (!this.enabled) {
      return { status: "disabled" };
    }

    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.botUrl}/health`),
      );
      return { status: data.status === "ok" ? "ok" : "degraded" };
    } catch {
      return { status: "unavailable" };
    }
  }
}
