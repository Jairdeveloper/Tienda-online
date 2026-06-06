import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

// Force Prisma to use the JavaScript/WASM library engine instead of the native binary.
// The native binary engine can cause SEGFAULT/SIGABRT in Vercel Lambda environments
// (FUNCTION_INVOCATION_FAILED) because spawning native binaries is unreliable on Lambda.
// The library engine (WASM-based) is designed for serverless and avoids this issue entirely.
// This env var must be set BEFORE PrismaClient is first imported/constructed.
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
    const vercel = process.env.VERCEL;
    const vercelEnv = process.env.VERCEL_ENV;

    // Clear VERCEL flags before instantiating PrismaClient to prevent
    // Prisma's Vercel postinstall/cron detection behavior.
    process.env.VERCEL = "";
    process.env.VERCEL_ENV = "";

    try {
      super();
    } catch (e) {
      // If the constructor fails (e.g., engine binary not found even with library engine),
      // log a descriptive error to aid debugging before rethrowing.
      const err = e instanceof Error ? e : new Error(String(e));
      this.logger.error(
        `PrismaClient constructor failed (PRISMA_CLIENT_ENGINE_TYPE=${process.env.PRISMA_CLIENT_ENGINE_TYPE}): ${err.message}`,
      );
      throw err;
    }

    if (vercel !== undefined) {
      process.env.VERCEL = vercel;
    }
    if (vercelEnv !== undefined) {
      process.env.VERCEL_ENV = vercelEnv;
    }
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
