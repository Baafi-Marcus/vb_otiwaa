import { Module } from '@nestjs/common';
import { NudgeService } from './nudge.service';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { OpenaiModule } from '../openai/openai.module';
import { NudgeController } from './nudge.controller';

@Module({
    imports: [WhatsappModule, OpenaiModule],
    providers: [NudgeService],
    controllers: [NudgeController],
    exports: [NudgeService],
})
export class NudgeModule { }
