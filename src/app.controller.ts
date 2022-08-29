import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { ActionInfo } from './dto/makeTrade.dto';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {
    console.log(Date.now().toString());
  }

  @MessagePattern({ cmd: 'get-balance' })
  async getBalance(@Payload() market: string) {
    return await this.appService.checkBalance(market);
  }

  @EventPattern('make-trade')
  makeAction(actionInfo: ActionInfo) {
    this.appService.makeAction(actionInfo);
    return 'info getted';
  }
}
