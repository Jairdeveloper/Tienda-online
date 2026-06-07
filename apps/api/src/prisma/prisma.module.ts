import { Global, Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from './prisma.service';

class PrismaModuleClass {}

const decorated = Module({
  providers: [
    PrismaService,
    { provide: PrismaClient, useExisting: PrismaService },
  ],
  exports: [PrismaService, PrismaClient],
})(PrismaModuleClass) || PrismaModuleClass;

Global()(decorated);

const PrismaModule = decorated;

export { PrismaModule };
