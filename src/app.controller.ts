import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { ActionInfo } from './dto/makeTrade.dto';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {
    this.appService.checkBalance('okex');
  }

  @MessagePattern({ cmd: 'get-balance' })
  async getBalance(@Payload() market: string) {
    const res = await this.appService.checkBalance(market);
    console.log(res);
    return res;
  }

  @EventPattern('make-trade')
  makeAction(actionInfo: ActionInfo) {
    this.appService.makeAction(actionInfo);
    return 'info getted';
  }
}
