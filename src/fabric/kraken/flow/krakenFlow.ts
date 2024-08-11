import { MarketFactory } from 'src/fabric/market.factory';
import { Kraken } from '../kraken';
import { KrakenService } from 'src/kraken/kraken.service';
import { Market } from 'src/interfaces/market.interface';

export class KrakenFlow extends MarketFactory {
  factoryMethod(
    amountToBuy: string,
    asset: string,
    redisBalance: string,
    aproxStableValue: string,
    service: KrakenService,
  ): Market {
    return new Kraken(
      amountToBuy,
      asset,
      redisBalance,
      aproxStableValue,
      service,
    );
  }
}
