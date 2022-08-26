import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { ActionInfo } from './dto/makeTrade.dto';
import { MarketType } from './dto/marketType.dto';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {
    this.makeAction({
      marketHigh: MarketType.BINANCE,
      marketLow: MarketType.KRAKEN,
      tradePercentage: '10',
    });
    this.getBalance('kraken');
    this.getBalance('binance');
  }

  @MessagePattern('get-balance')
  async getBalance(@Payload() market: string) {
    return await this.appService.checkBalance(market);
  }

  @EventPattern('make-trade')
  async makeAction(actionInfo: ActionInfo) {
    await this.appService.makeAction(actionInfo);
  }
}
