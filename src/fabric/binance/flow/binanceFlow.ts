import { MarketFactory } from 'src/fabric/market.factory';
import { Binance } from '../binance';
import { BinanceService } from 'src/binance/binance.service';

export class BinanceFlow extends MarketFactory {
  factoryMethod(
    amountToBuy: string,
    asset: string,
    redisBalance: string,
    aproxStableValue: string,
    service: BinanceService,
  ): Market {
    return new Binance(
      amountToBuy,
      asset,
      redisBalance,
      aproxStableValue,
      service,
    );
  }
}
