import { BinanceService } from 'src/binance/binance.service';
import { ActionType, redisInstance } from 'src/redis/redis.service';

export class Binance implements Market {
  private amountToBuy: string;
  private asset: string;
  private aproxStableValue: string;

  constructor(
    amountToBuy: string,
    asset: string,
    aproxStableValue: string,
    private readonly service: BinanceService,
  ) {
    this.aproxStableValue = aproxStableValue;
    this.amountToBuy = amountToBuy;
    this.asset = asset;
  }

  async buy(): Promise<void> {
    const result = await this.service.buy(this.amountToBuy, this.asset);
    await redisInstance.setTransactionRedis({
      externalTransactionId: result?.orderId,
      market: 'binance',
      amountToBuy: result?.origQty,
      price: result?.fills[0].price,
      asset: result?.symbol,
      status: result?.status,
      type: ActionType.SPOT_BUY,
      balanceType: 'spot',
      value: Number(this.amountToBuy) - Number(result?.cummulativeQuoteQty),
    });
  }
  async transfer(): Promise<void> {
    const result = await this.service.transfer(
      this.asset,
      await this.service.getDepositAddress(this.asset),
    );
    redisInstance.set(
      {
        key: 'TRANSFER',
        transactionId: result?.id,
      },
      300,
    );
  }
}
