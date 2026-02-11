import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BullModule } from '@nestjs/bull'
import { WinstonModule } from 'nest-winston'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { APP_GUARD } from '@nestjs/core'
import * as winston from 'winston'

// Modules
import { MerchantsModule } from './merchants/merchants.module'
import { AuthModule } from './auth/auth.module'
import { WebhooksModule } from './webhooks/webhooks.module'
import { OrdersModule } from './orders/orders.module'
import { CustomersModule } from './customers/customers.module'
import { MetricsModule } from './metrics/metrics.module'
import { GatesModule } from './gates/gates.module'
import { KlaviyoModule } from './klaviyo/klaviyo.module'
import { ReportsModule } from './reports/reports.module'
import { JobsModule } from './jobs/jobs.module'
import { JourneysModule } from './journeys/journeys.module'
import { CROModule } from './cro/cro.module'
import { CampaignsModule } from './campaigns/campaigns.module'
import { TemplatesModule } from './templates/templates.module'
import { ShopifyModule } from './shopify/shopify.module'
import { BackfillModule } from './backfill/backfill.module'
import { ETLModule } from './etl/etl.module'
import { NotificationsModule } from './notifications/notifications.module'
import { PhasesModule } from './phases/phases.module'

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Logging
    WinstonModule.forRoot({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
      ],
    }),

    // Database (OLTP) - Transactional data
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: process.env.NODE_ENV === 'development', // Only in dev
        logging: process.env.NODE_ENV === 'development',
      }),
      inject: [ConfigService],
    }),

    // Database (OLAP) - Analytics data warehouse
    TypeOrmModule.forRootAsync({
      name: 'analytics',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('ANALYTICS_DB_HOST'),
        port: configService.get('ANALYTICS_DB_PORT'),
        username: configService.get('ANALYTICS_DB_USERNAME'),
        password: configService.get('ANALYTICS_DB_PASSWORD'),
        database: configService.get('ANALYTICS_DB_DATABASE'),
        entities: [], // No entities - using raw queries for analytics
        synchronize: false, // Never auto-sync analytics DB
        logging: process.env.NODE_ENV === 'development',
      }),
      inject: [ConfigService],
    }),

    // Redis & Bull (Job Queue)
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests per ttl window
      },
    ]),

    // Feature Modules
    MerchantsModule,
    AuthModule,
    WebhooksModule,
    OrdersModule,
    CustomersModule,
    MetricsModule,
    GatesModule,
    PhasesModule,
    KlaviyoModule,
    ReportsModule,
    JobsModule,
    JourneysModule,
    CROModule,
    CampaignsModule,
    TemplatesModule,
    ShopifyModule,
    BackfillModule,
    ETLModule,
    NotificationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
