import { Controller, Get } from "@nestjs/common";
import { Public } from "./auth/decorators/public.decorator";

@Public()
@Controller("debug")
export class DebugController {
  @Get()
  index() {
    return { status: "debug_ok", modules: ["debug"], timestamp: new Date().toISOString() };
  }

  @Get("bot-simple")
  botSimple() {
    return { status: "bot_simple_ok" };
  }
}
