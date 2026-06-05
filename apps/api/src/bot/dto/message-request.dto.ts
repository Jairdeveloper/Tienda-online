import { IsOptional, IsString, MinLength } from "class-validator";

export class MessageRequestDto {
  @IsString()
  @MinLength(1)
  text!: string;

  @IsString()
  @IsOptional()
  sessionId?: string;

  @IsOptional()
  context?: Record<string, unknown>;
}
