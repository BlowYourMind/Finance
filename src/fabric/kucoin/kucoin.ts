import { BinanceService } from 'src/binance/binance.service';
import { Market } from 'src/interfaces/market.interface';
import { KrakenService } from 'src/kraken/kraken.service';
import { KucoinService } from 'src/kucoin/kucoin.service';
import { ActionType, redisInstance } from 'src/redis/redis.service';

export class Kucoin implements Market {
  private amountToBuy: string;
  private asset: string;
  private aproxStableValue: string;
  private redisBalance: string;

  constructor(
    amountToBuy: string,
    asset: string,
    aproxStableValue: string,
    redisBalance: string,
    private readonly service: KucoinService,
  ) {
    this.aproxStableValue = aproxStableValue;
    this.amountToBuy = amountToBuy;
    this.asset = asset;
    this.redisBalance = redisBalance;
  }

  async buy(): Promise<void> {
    const response = await this.service.buy(
      this.amountToBuy,
      this.asset,
      this.aproxStableValue,
    );
    console.log(response);
  }
  async sell(amountSell?: any): Promise<void> {
    const response = await this.service.sell("0.005", this.asset);
    console.log(response);
  }
  async transfer(krakenService: KrakenService): Promise<void> {}
}
