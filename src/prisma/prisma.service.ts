import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const vercel = process.env.VERCEL;
    const vercelEnv = process.env.VERCEL_ENV;
    process.env.VERCEL = "";
    process.env.VERCEL_ENV = "";
    super();
    if (vercel !== undefined) {
      process.env.VERCEL = vercel;
    }
    if (vercelEnv !== undefined) {
      process.env.VERCEL_ENV = vercelEnv;
    }
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
