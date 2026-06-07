import { Global, Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from './prisma.service';

class PrismaModuleClass {}

const PrismaModule: new () => any = Global()(
  Module({
    providers: [
      PrismaService,
      { provide: PrismaClient, useExisting: PrismaService },
    ],
    exports: [PrismaService, PrismaClient],
  })(PrismaModuleClass) as new () => any,
) as new () => any;

export { PrismaModule };
