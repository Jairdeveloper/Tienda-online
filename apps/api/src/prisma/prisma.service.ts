import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) {
  process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
}

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private _client: PrismaClient | null = null;
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    return new Proxy(this, {
      get: (target, prop) => {
        if (prop in target || typeof prop === "symbol") {
          const value = (target as Record<string | symbol, unknown>)[prop];
          if (typeof value === "function") {
            return value.bind(target);
          }
          return value;
        }
        const client = target._getClient();
        const clientValue = (client as unknown as Record<string, unknown>)[prop as string];
        if (typeof clientValue === "function") {
          return clientValue.bind(client);
        }
        return clientValue;
      },
    });
  }

  private _getClient(): PrismaClient {
    if (!this._client) {
      this._client = new PrismaClient();
      this.logger.log("PrismaClient lazily created");
    }
    return this._client;
  }

  async onModuleInit(): Promise<void> {
    this.logger.log(
      `PrismaService initialized (engine: ${process.env.PRISMA_CLIENT_ENGINE_TYPE || "binary"}, lazy connect enabled, Proxy mode)`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    if (this._client) {
      try {
        await this._client.$disconnect();
      } catch (e) {
        this.logger.warn(
          `Error disconnecting database: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
  }
}
