import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) {
  process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: ["warn", "error"],
    });
  }

  async onModuleInit(): Promise<void> {
    this.logger.log(
      `PrismaService initialized (engine: ${process.env.PRISMA_CLIENT_ENGINE_TYPE || "binary"})`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.$disconnect();
    } catch (e) {
      this.logger.warn(
        `Error disconnecting database: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }
}
