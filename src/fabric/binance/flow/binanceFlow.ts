import { MarketFactory } from 'src/fabric/market.factory';
import { Binance } from '../binance';
import { BinanceService } from 'src/binance/binance.service';
import { Market } from 'src/interfaces/market.interface';

export class BinanceFlow extends MarketFactory {
  factoryMethod(
    amountToBuy: string,
    asset: string,
    redisBalance: string,
    redisFuturesBalance: string,
    aproxStableValue: string,
    service: BinanceService,
  ): Market {
    return new Binance(
      amountToBuy,
      asset,
      redisBalance,
      redisFuturesBalance,
      aproxStableValue,
      service,
    );
  }
}
