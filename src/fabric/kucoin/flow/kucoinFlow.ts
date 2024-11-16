import { KucoinService } from 'src/kucoin/kucoin.service';
import { Kucoin } from '../kucoin';
import { Market } from 'src/interfaces/market.interface';
import { MarketFactory } from 'src/fabric/market.factory';

export class KucoinFlow extends MarketFactory {
  factoryMethod(
    amountToBuy: string,
    asset: string,
    redisBalance: string,
    aproxStableValue: string,
    service: KucoinService,
  ): Market {
    return new Kucoin(
      amountToBuy,
      asset,
      redisBalance,
      aproxStableValue,
      service,
    );
  }
}
