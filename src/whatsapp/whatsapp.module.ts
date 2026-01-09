import { Module, forwardRef } from '@nestjs/common';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TwilioModule } from '../twilio/twilio.module';
import { HttpModule } from '@nestjs/axios';
import { OpenaiModule } from 'src/openai/openai.module';
import { UserContextModule } from 'src/user-context/user-context.module';
import { AudioModule } from 'src/audio/audio.module';
import { StabilityaiModule } from 'src/stabilityai/stabilityai.module';

@Module({
  imports: [
    HttpModule,
    PrismaModule,
    TwilioModule,
    forwardRef(() => OpenaiModule),
    UserContextModule,
    AudioModule,
    StabilityaiModule,
  ],
  controllers: [WhatsappController],
  providers: [WhatsappService],
  exports: [WhatsappService],
})
export class WhatsappModule { }
