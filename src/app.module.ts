import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { REDIS_CLIENT } from './redis/redis.constants';
import type { RedisClient } from './redis/redis.constants';
import { RedisThrottlerStorage } from './common/throttler/redis-throttler-storage';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { PermissionsGuard } from './auth/guards/permissions.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { CartModule } from './cart/cart.module';
import { CatalogModule } from './catalog/catalog.module';
import { CheckoutModule } from './checkout/checkout.module';
import { CommonModule } from './common/common.module';
import { validationSchema } from './config/env.validation';
import { HealthModule } from './health/health.module';
import { InventoryModule } from './inventory/inventory.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      validationSchema,
    }),
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: [REDIS_CLIENT],
      useFactory: (redisClient: RedisClient) => ({
        throttlers: [{ ttl: 60000, limit: 60 }],
        storage: new RedisThrottlerStorage(redisClient),
      }),
    }),
    CommonModule,
    PrismaModule,
    RedisModule,
    HealthModule,
    AuthModule,
    UsersModule,
    CatalogModule,
    InventoryModule,
    CartModule,
    CheckoutModule,
    OrdersModule,
    PaymentsModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule {}
