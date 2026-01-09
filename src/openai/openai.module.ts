import { Module, forwardRef } from '@nestjs/common';
import { OpenaiService } from './openai.service';
import { UserContextService } from 'src/user-context/user-context.service';
import { OrderModule } from 'src/order/order.module';

@Module({
  imports: [forwardRef(() => OrderModule)],
  providers: [OpenaiService, UserContextService],
  exports: [OpenaiService],
})
export class OpenaiModule { }
