import { BinanceService } from 'src/binance/binance.service';
import { Market } from 'src/interfaces/market.interface';
import { KucoinService } from 'src/kucoin/kucoin.service';
import { ActionType, redisInstance } from 'src/redis/redis.service';

export class Gate implements Market {
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
    private readonly service: KucoinService,
  ) {
    this.aproxStableValue = aproxStableValue;
    this.amountToBuy = amountToBuy;
    this.asset = asset;
    this.redisBalance = redisBalance;
    this.redisFuturesBalance = redisFuturesBalance;
  }

  async buy(): Promise<void> {
    const result = await this.service.buy(
      this.amountToBuy,
      this.asset,
      this.aproxStableValue,
    );
    await redisInstance.setTransactionRedis({
      externalTransactionId: result?.id,
      market: 'gate',
      amountToBuy: result.info.filled_amount,
      price: result?.price,
      asset: 'usdt',
      status: result?.status,
      type: ActionType.SPOT_BUY,
      balanceType: 'spot',
      value: Number(this.redisBalance) - Number(result?.cost),
    });
    console.log('spot buy result----', result);
  }
  async sell(): Promise<void> {
    const result = await this.service.sell(this.asset);
    await redisInstance.setTransactionRedis({
      externalTransactionId: result?.id,
      market: 'gate',
      amountToBuy: result?.amount,
      price: result?.price,
      asset: 'usdt',
      status: result?.status,
      type: ActionType.SPOT_SELL,
      balanceType: 'spot',
      value: Number(this.redisBalance) + Number(result.cost),
    });
    console.log('Spot sell result----', result);
  }
  async futureBuy(): Promise<void> {
    const result = await this.service.futureBuy(this.amountToBuy, this.asset);
    await redisInstance.setTransactionRedis({
      externalTransactionId: result?.id,
      market: 'gate',
      amountToBuy: Number(result?.amount),
      price: result?.price,
      asset: 'usdt',
      status: result?.status,
      type: ActionType.FUTURE_BUY,
      balanceType: 'futures',
      value: Number(this.redisFuturesBalance) - Number(result?.cost) / 5,
    });
    console.log('Future Buy Response----', result);
  }
  async futureSell(): Promise<void> {
    const result = await this.service.futureSell(this.asset);
    await redisInstance.setTransactionRedis({
      externalTransactionId: result?.id,
      market: 'gate',
      amountToBuy: Number(result?.amount),
      price: result?.price,
      asset: 'usdt',
      status: result?.status,
      type: ActionType.FUTURE_SELL,
      balanceType: 'futures',
      value: Number(this.redisFuturesBalance) + Number(result?.cost) / 5,
    });
    console.log('Future Sell Response----', result);
  }
  async transfer(highMarket: any): Promise<void> {
    const highMarketNetworks = await highMarket.service.getNetworks(this.asset);
    console.log(highMarketNetworks);
    const lowMarketNetworks = await this.service.getNetworks(this.asset, true);
    console.log(lowMarketNetworks);
    const bestNetwork = await this.compareNetworks(
      lowMarketNetworks,
      highMarketNetworks,
    );
    console.log(bestNetwork);
    const address = await highMarket.service.getDepositAddress(
      this.asset,
      bestNetwork,
    );
    const result = await this.service.transfer(
      this.asset,
      address,
      bestNetwork.toLowerCase(),
    );
    redisInstance.set(
      {
        key: 'TRANSFER',
        transactionId: result?.id,
      },
      300,
    );
  }
  async checkReceivedAsset(): Promise<void> {
    const result = await this.service.checkReceivedAsset(this.asset);
    if (result.success) {
      this.sell();
      this.futureSell();
    }
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
      console.log(lowNetwork);
      if (lowNetwork && lowNetwork.enabled) {
        return highNetwork.network;
      }
    }
    return null;
  }
}
