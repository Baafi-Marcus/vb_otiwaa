import { Module } from '@nestjs/common';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { OpenaiModule } from './openai/openai.module';
import { UserContextModule } from './user-context/user-context.module';
import { StabilityaiModule } from './stabilityai/stabilityai.module';
import { AudioModule } from './audio/audio.module';
import { PrismaModule } from './prisma/prisma.module';
import { MerchantModule } from './merchant/merchant.module';

import { SystemModule } from './system/system.module';
import { OrderModule } from './order/order.module';
import { AuthModule } from './auth/auth.module';
import { NotificationModule } from './notification/notification.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { MarketingModule } from './marketing/marketing.module';
import { NudgeModule } from './nudge/nudge.module';
import { AdminModule } from './admin/admin.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'frontend', 'dist'),
      exclude: ['/api/(.*)'],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    PrismaModule,
    WhatsappModule,
    OpenaiModule,
    UserContextModule,
    StabilityaiModule,
    AudioModule,
    MerchantModule,
    SystemModule,
    OrderModule,
    AuthModule,
    NotificationModule,
    AnalyticsModule,
    MarketingModule,
    NudgeModule,
    AdminModule,
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
