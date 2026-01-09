import { Module } from '@nestjs/common';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { ConfigModule } from '@nestjs/config';
import { OpenaiModule } from './openai/openai.module';
import { UserContextModule } from './user-context/user-context.module';
import { StabilityaiModule } from './stabilityai/stabilityai.module';
import { AudioModule } from './audio/audio.module';
import { PrismaModule } from './prisma/prisma.module';
import { MerchantModule } from './merchant/merchant.module';

import { SystemModule } from './system/system.module';
import { OrderModule } from './order/order.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    ConfigModule.forRoot(),
    PrismaModule,
    WhatsappModule,
    OpenaiModule,
    UserContextModule,
    StabilityaiModule,
    AudioModule,
    MerchantModule,
    SystemModule,
    OrderModule,
  ],
})
export class AppModule { }
