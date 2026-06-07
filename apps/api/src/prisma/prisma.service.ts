import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) {
  process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
}

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  public readonly prisma: PrismaClient;
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    this.prisma = new PrismaClient({
      log: ["warn", "error"],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...({ __internal: { configOverride: (config: any) => ({ ...config, postinstall: false }) } } as any),
    });
    this.logger.log("PrismaClient created");
  }

  async onModuleInit(): Promise<void> {
    this.logger.log(
      `PrismaService initialized (engine: ${process.env.PRISMA_CLIENT_ENGINE_TYPE || "binary"})`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.prisma.$disconnect();
    } catch (e) {
      this.logger.warn(
        `Error disconnecting database: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }
}
