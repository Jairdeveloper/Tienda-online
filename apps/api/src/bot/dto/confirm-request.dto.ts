import { IsOptional, IsString } from "class-validator";

export class ConfirmRequestDto {
  @IsString()
  @IsOptional()
  text?: string;

  @IsString()
  sessionId!: string;
}
