import { KucoinService } from 'src/kucoin/kucoin.service';
import { Poloniex } from '../poloniex';
import { Market } from 'src/interfaces/market.interface';
import { MarketFactory } from 'src/fabric/market.factory';

export class PoloniexFlow extends MarketFactory {
  factoryMethod(
    amountToBuy: string,
    asset: string,
    redisBalance: string,
    redisFuturesBalance: string,
    aproxStableValue: string,
    service: KucoinService,
  ): Market {
    return new Poloniex(
      amountToBuy,
      asset,
      redisBalance,
      redisFuturesBalance,
      aproxStableValue,
      service,
    );
  }
}
