import { Controller, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { ActionInfo } from './dto/makeTrade.dto';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { MarketType } from './dto/marketType.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {
    // this.makeFutureAction({
    //   asset: 'ETH',
    //   marketLow: MarketType.BINANCE,
    //   marketHigh: MarketType.BINANCE,
    //   amountToBuy: '0.00939408',
    // });
    // this.getBalanceHttp();
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

  // http request get balance from markets
  @Post('get-balance')
  async getBalanceHttp() {
    const res = await this.appService.getAllBalances();
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
