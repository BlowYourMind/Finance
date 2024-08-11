import { BinanceService } from 'src/binance/binance.service';
import { Market } from 'src/interfaces/market.interface';
import { KrakenService } from 'src/kraken/kraken.service';

export abstract class MarketFactory {
  abstract factoryMethod(
    amountToBuy: string,
    asset: string,
    aproxStableValue: string,
    redisBalance: string,
    service: KrakenService | BinanceService,
  ): Market;

  getMarket(
    amountToBuy: string,
    asset: string,
    aproxStableValue: string,
    redisBalance: string,
    service: KrakenService | BinanceService,
  ): Market {
    const market = this.factoryMethod(
      amountToBuy,
      asset,
      aproxStableValue,
      redisBalance,
      service,
    );
    return market;
  }
}
