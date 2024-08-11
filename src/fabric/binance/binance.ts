import { BinanceService } from 'src/binance/binance.service';
import { Market } from 'src/interfaces/market.interface';
import { KrakenService } from 'src/kraken/kraken.service';
import { ActionType, redisInstance } from 'src/redis/redis.service';

export class Binance implements Market {
  private amountToBuy: string;
  private asset: string;
  private aproxStableValue: string;
  private redisBalance: string;

  constructor(
    amountToBuy: string,
    asset: string,
    aproxStableValue: string,
    redisBalance: string,
    private readonly service: BinanceService,
  ) {
    this.aproxStableValue = aproxStableValue;
    this.amountToBuy = amountToBuy;
    this.asset = asset;
    this.redisBalance = redisBalance;
  }

  async buy(): Promise<void> {
    const result = await this.service.buy(this.redisBalance, this.asset);
    await redisInstance.setTransactionRedis({
      externalTransactionId: result?.orderId,
      market: 'binance',
      amountToBuy: result?.origQty,
      price: result?.fills[0].price,
      asset: result?.symbol,
      status: result?.status,
      type: ActionType.SPOT_BUY,
      balanceType: 'spot',
      value: Number(this.redisBalance) - Number(result?.cummulativeQuoteQty),
    });
    console.log('Binance Spot Buy', result);
  }
  async transfer(krakenService: KrakenService): Promise<void> {
    const result = await this.service.transfer(
      this.asset,
      await krakenService.getDepositAddress(this.asset),
    );
    redisInstance.set(
      {
        key: 'TRANSFER',
        transactionId: result?.id,
      },
      300,
    );
    console.log('Transfer Low Market', result);
  }
}
