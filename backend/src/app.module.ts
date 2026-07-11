import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { join } from 'path';

import { envValidationSchema } from '@/config/env.validation';
import { GlobalExceptionFilter } from '@/shared/infrastructure/filters/domain-exception.filter';
import { ResponseInterceptor } from '@/shared/infrastructure/interceptors/response.interceptor';
import { JwtAuthGuard } from '@/shared/infrastructure/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/shared/infrastructure/guards/permissions.guard';
import { UPLOADS_DIR, UPLOADS_ROUTE } from '@/shared/infrastructure/uploads/uploads.constants';

import { AuthModule } from '@/modules/auth/auth.module';
import { CompaniesModule } from '@/modules/companies/companies.module';
import { RolesModule } from '@/modules/roles/roles.module';
import { UsersModule } from '@/modules/users/users.module';
import { BranchesModule } from '@/modules/branches/branches.module';
import { StoresModule } from '@/modules/stores/stores.module';
import { BrandsModule } from '@/modules/brands/brands.module';
import { CategoriesModule } from '@/modules/categories/categories.module';
import { ProductsModule } from '@/modules/products/products.module';
import { ProductFeaturesModule } from '@/modules/product-features/product-features.module';
import { ProductPriceTiersModule } from '@/modules/product-price-tiers/product-price-tiers.module';
import { ProductBundlesModule } from '@/modules/product-bundles/product-bundles.module';
import { InventoryModule } from '@/modules/inventory/inventory.module';
import { CurrenciesModule } from '@/modules/currencies/currencies.module';
import { OrdersModule } from '@/modules/orders/orders.module';
import { UploadsModule } from '@/modules/uploads/uploads.module';
import { CustomersModule } from '@/modules/customers/customers.module';
import { DealsModule } from '@/modules/deals/deals.module';
import { WhatsAppModule } from '@/modules/whatsapp/whatsapp.module';
import { PointsModule } from '@/modules/points/points.module';
import { RafflesModule } from '@/modules/raffles/raffles.module';
import { DevToolsModule } from '@/modules/dev-tools/dev-tools.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASS'),
        database: config.get<string>('DB_NAME'),
        entities: [join(__dirname, 'modules/**/*.orm-entity.{ts,js}')],
        migrations: [join(__dirname, 'database/migrations/*.{ts,js}')],
        synchronize: true,
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),

    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL_MS') ?? 60000,
          limit: config.get<number>('THROTTLE_LIMIT') ?? 100,
        },
      ],
    }),

    ServeStaticModule.forRoot({
      rootPath: UPLOADS_DIR,
      serveRoot: UPLOADS_ROUTE,
    }),

    AuthModule,
    CompaniesModule,
    RolesModule,
    UsersModule,
    BranchesModule,
    StoresModule,
    BrandsModule,
    CategoriesModule,
    ProductsModule,
    ProductFeaturesModule,
    ProductPriceTiersModule,
    ProductBundlesModule,
    InventoryModule,
    CurrenciesModule,
    OrdersModule,
    UploadsModule,
    CustomersModule,
    DealsModule,
    WhatsAppModule,
    PointsModule,
    RafflesModule,
    DevToolsModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
