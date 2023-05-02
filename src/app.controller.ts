import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { ActionInfo } from './dto/makeTrade.dto';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { MarketType } from './dto/marketType.dto';
import { log } from 'console';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {
    this.makeFutureAction({
      asset: 'BTC',
      marketLow: MarketType.OKEX,
      marketHigh: MarketType.OKEX,
      amountToBuy: '0.01',
    });
   }

  @MessagePattern({ cmd: 'ping' })
  async ping(@Payload() test: string) {
    console.log('ping');
    return test;
  }

  @MessagePattern({ cmd: 'get-balance' })
  async getBalance(@Payload() market: MarketType) {
    const res = await this.appService.checkBalance(market);
    console.log(market);
    console.log(Date.now().toLocaleString());

    console.log(res);
    return res;
  }

  @EventPattern('make-trade')
  makeAction(actionInfo: ActionInfo) {
    return 'Disabled function';
  }

  @EventPattern('make-future-trade')
  makeFutureAction(actionFutureInfo: ActionInfo) {
    this.appService.makeFutureAction(actionFutureInfo);
    return 'Everything Setted';
  }
}
