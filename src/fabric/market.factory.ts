import { KrakenService } from 'src/kraken/kraken.service';

export abstract class MarketFactory {
  abstract factoryMethod(
    amountToBuy: string,
    asset: string,
    aproxStableValue: string,
    service: KrakenService,
  ): Market;

  getMarket(
    amountToBuy: string,
    asset: string,
    aproxStableValue: string,
    service: KrakenService,
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
