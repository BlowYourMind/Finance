import { BinanceService } from 'src/binance/binance.service';
import { Market } from 'src/interfaces/market.interface';
import { ActionType, redisInstance } from 'src/redis/redis.service';
// Network name mappings between exchanges
export class Binance implements Market {
  private amountToBuy: string;
  private asset: string;
  private aproxStableValue: string;
  private redisBalance: string;
  private redisFuturesBalance: string;

  constructor(
    amountToBuy: string,
    asset: string,
    aproxStableValue: string,
    redisBalance: string,
    redisFuturesBalance: string,
    private readonly service: BinanceService,
  ) {
    this.aproxStableValue = aproxStableValue;
    this.amountToBuy = amountToBuy;
    this.asset = asset;
    this.redisBalance = redisBalance;
    this.redisFuturesBalance = redisFuturesBalance;
  }

  async buy(): Promise<void> {
    const result = await this.service.buy(this.amountToBuy, this.asset);
    await redisInstance.setTransactionRedis({
      externalTransactionId: result?.info.orderId,
      market: 'binance',
      amountToBuy: result?.info.origQty,
      price: result?.price,
      asset: result?.symbol,
      status: result?.status,
      type: ActionType.SPOT_BUY,
      balanceType: 'spot',
      value: Number(this.redisBalance) - Number(result?.cost),
    });
    console.log('Binance Spot Buy', result);
  }
  async transfer(highMarket: any): Promise<void> {
    const highMarketNetworks = await highMarket.service.getNetworks(this.asset);
    const lowMarketNetworks = await this.service.getNetworks(this.asset,true);
    const bestNetwork = await this.compareNetworks(
      lowMarketNetworks,
      highMarketNetworks,
    );
    const address = await highMarket.service.getDepositAddress(
      this.asset,
      bestNetwork,
    );
    const result = await this.service.transfer(
      this.asset,
      address,
      bestNetwork.toLowerCase(),
    );
    // redisInstance.set(
    //   {
    //     key: 'TRANSFER',
    //     transactionId: result?.id,
    //   },
    //   300,
    // );
    console.log('Transfer Low Market', result);
  }

  async compareNetworks(
    lowMarketNetworks: any[],
    highMarketNetworks: any[],
  ): Promise<string | null> {
    const lowMarketMap = new Map(
      lowMarketNetworks.map((network) => [
        network.network.toLowerCase(),
        network,
      ]),
    );
    for (const highNetwork of highMarketNetworks) {
      const lowNetwork = lowMarketMap.get(highNetwork.network.toLowerCase());
      if (lowNetwork && lowNetwork.withdrawEnabled) {
        return highNetwork.network;
      }
    }
    return null;
  }
}
