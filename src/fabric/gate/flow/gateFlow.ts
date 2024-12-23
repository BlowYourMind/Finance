import { KucoinService } from 'src/kucoin/kucoin.service';
import { Market } from 'src/interfaces/market.interface';
import { MarketFactory } from 'src/fabric/market.factory';
import { Gate } from '../gate';

export class GateFlow extends MarketFactory {
  factoryMethod(
    amountToBuy: string,
    asset: string,
    redisBalance: string,
    redisFuturesBalance: string,
    aproxStableValue: string,
    service: KucoinService,
  ): Market {
    return new Gate(
      amountToBuy,
      asset,
      redisBalance,
      redisFuturesBalance,
      aproxStableValue,
      service,
    );
  }
}
