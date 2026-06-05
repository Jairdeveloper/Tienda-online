import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

class SourceDto {
  @ApiProperty()
  type: string;

  @ApiProperty()
  title: string;
}

export class BotResponseDto {
  @ApiProperty()
  sessionId: string;

  @ApiProperty()
  reply: string;

  @ApiProperty()
  intent: string;

  @ApiProperty()
  requiresConfirmation: boolean;

  @ApiPropertyOptional()
  pendingActionId?: string;

  @ApiProperty({ type: [SourceDto] })
  sources: SourceDto[];

  @ApiProperty()
  requestId: string;
}
