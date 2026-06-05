import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import botConfig from "./config/bot.config";
import { BotController } from "./bot.controller";
import { BotService } from "./bot.service";

@Module({
  imports: [
    ConfigModule.forFeature(botConfig),
    HttpModule.register({ timeout: 10000, maxRedirects: 0 }),
  ],
  controllers: [BotController],
  providers: [BotService],
})
export class BotModule {}
