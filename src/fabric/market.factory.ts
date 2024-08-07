import { BinanceService } from 'src/binance/binance.service';
import { KrakenService } from 'src/kraken/kraken.service';

export abstract class MarketFactory {
  abstract factoryMethod(
    amountToBuy: string,
    asset: string,
    aproxStableValue: string,
    service: KrakenService | BinanceService,
  ): Market;

  getMarket(
    amountToBuy: string,
    asset: string,
    aproxStableValue: string,
    service: KrakenService | BinanceService,
  ): Market {
    const market = this.factoryMethod(
      amountToBuy,
      asset,
      aproxStableValue,
      service,
    );
    return market;
  }
}
