import { BinanceService } from 'src/binance/binance.service';
import { Market } from 'src/interfaces/market.interface';
import { KucoinService } from 'src/kucoin/kucoin.service';

export abstract class MarketFactory {
  abstract factoryMethod(
    amountToBuy: string,
    asset: string,
    aproxStableValue: string,
    redisBalance: string,
    redisFuturesBalance: string,
    service: BinanceService | KucoinService,
  ): Market;

  getMarket(
    amountToBuy: string,
    asset: string,
    aproxStableValue: string,
    redisBalance: string,
    redisFuturesBalance: string,
    service: BinanceService | KucoinService,
  ): Market {
    const market = this.factoryMethod(
      amountToBuy,
      asset,
      aproxStableValue,
      redisBalance,
      redisFuturesBalance,
      service,
    );
    return market;
  }
}
