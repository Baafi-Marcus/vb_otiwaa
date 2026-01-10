import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import { NudgeService } from './nudge.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('nudge')
@UseGuards(JwtAuthGuard)
export class NudgeController {
    constructor(private readonly nudgeService: NudgeService) { }

    @Post('manual/:customerId')
    async manualNudge(@Param('customerId') customerId: string) {
        return this.nudgeService.triggerManualNudge(customerId);
    }
}
