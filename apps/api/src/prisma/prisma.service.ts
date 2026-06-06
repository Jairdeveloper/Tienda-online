import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) {
  process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super();
  }

  /**
   * Lazy initialization: intentionally does NOT call $connect().
   *
   * PrismaClient's internal methods (e.g., $queryRaw, model findMany, etc.)
   * automatically call $connect() on first use. By deferring the connection,
   * we avoid potential native engine crashes during NestJS app initialization
   * in serverless environments. Connection errors will surface on the first
   * actual query, where they can be caught and handled gracefully.
   */
  async onModuleInit(): Promise<void> {
    this.logger.log(
      `PrismaService initialized (engine: ${process.env.PRISMA_CLIENT_ENGINE_TYPE || "binary"}, lazy connect enabled)`,
    );
    // NOT calling this.$connect() — deferred to first query.
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
