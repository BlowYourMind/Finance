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
    const result = await this.service.buy(
      this.amountToBuy,
      this.asset,
      this.aproxStableValue,
    );
    await redisInstance.setTransactionRedis({
      externalTransactionId: result?.id,
      market: 'kucoin',
      amountToBuy: this.amountToBuy,
      price: result?.price,
      asset: 'usdt',
      status: result?.status,
      type: ActionType.SPOT_BUY,
      balanceType: 'spot',
      value:
        Number(this.redisBalance) -
        (Number(result?.cost) + Number(result?.fee.cost)),
    });
    console.log(result);
  }
  async sell(): Promise<void> {
    const result = await this.service.sell(this.asset);
    await redisInstance.setTransactionRedis({
      externalTransactionId: result?.id,
      market: 'kucoin',
      amountToBuy: result?.amount,
      price: result?.price,
      asset: 'usdt',
      status: result?.status,
      type: ActionType.SPOT_SELL,
      balanceType: 'spot',
      value:
        Number(this.redisBalance) +
        Number(result.cost) -
        Number(result.fee.cost),
    });
    console.log(result);
  }
  async transfer(krakenService: KrakenService): Promise<void> {}
}
