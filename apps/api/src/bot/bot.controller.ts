import {
  Body,
  Controller,
  Get,
  Post,
  Req,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiTags,
} from "@nestjs/swagger";
import type { Request } from "express";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../auth/decorators/current-user.decorator";
import { Public } from "../auth/decorators/public.decorator";
import { BotService } from "./bot.service";
import { ConfirmRequestDto } from "./dto/confirm-request.dto";
import { MessageRequestDto } from "./dto/message-request.dto";
import type { BotResponseDto } from "./dto/bot-response.dto";

@ApiTags("bot")
@ApiBearerAuth()
@Controller("bot")
export class BotController {
  constructor(private readonly botService: BotService) {}

  @Post("messages")
  @ApiOkResponse({ description: "Procesa un mensaje del chat" })
  async sendMessage(
    @Body() dto: MessageRequestDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<BotResponseDto> {
    const jwt = req.headers.authorization?.replace("Bearer ", "") || "";
    return this.botService.processMessage(
      dto.text,
      dto.sessionId,
      user,
      jwt,
      dto.context,
    );
  }

  @Post("confirm")
  @ApiOkResponse({ description: "Confirma o cancela una accion pendiente" })
  async confirmAction(
    @Body() dto: ConfirmRequestDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<BotResponseDto> {
    const jwt = req.headers.authorization?.replace("Bearer ", "") || "";
    return this.botService.confirmAction(dto.text, dto.sessionId, user, jwt);
  }

  @Get("status")
  @Public()
  @ApiOkResponse({ description: "Estado del servicio bot" })
  async getStatus(): Promise<{ status: string }> {
    return this.botService.getStatus();
  }
}
