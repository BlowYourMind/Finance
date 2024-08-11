import { KrakenWallets } from 'src/dto/kraken.dto';
import { KrakenService } from 'src/kraken/kraken.service';
import { ActionType, redisInstance } from 'src/redis/redis.service';

export class Kraken implements Market {
  private amountToBuy: string;
  private asset: string;
  private aproxStableValue: string;
  private redisBalance: string;

  constructor(
    amountToBuy: string,
    asset: string,
    aproxStableValue: string,
    redisBalance: string,
    private readonly service: KrakenService,
  ) {
    this.aproxStableValue = aproxStableValue;
    this.amountToBuy = amountToBuy;
    this.asset = asset;
    this.redisBalance = redisBalance;
  }

  async buy(): Promise<void> {
    const result = await this.service.buy(this.amountToBuy, this.asset);
    await redisInstance.setTransactionRedis({
      externalTransactionId: result?.result.txid,
      market: 'kraken',
      amountToBuy: this.amountToBuy,
      price: result?.result.price,
      asset: this.asset,
      status: result?.result.status,
      type: ActionType.SPOT_BUY,
      balanceType: 'spot',
      value:
        Number(this.amountToBuy) -
        (Number(result?.result.cost) + Number(result?.result.fee)),
    });
    console.log(result);
    console.log('SpotBuy: ', result);
    console.log(await redisInstance.get('action-kraken'));
  }
  async sell(amountSell?: any): Promise<void> {
    const amount = amountSell ? amountSell : this.amountToBuy;
    const result = await this.service.sell(amount, this.asset.toUpperCase());
    await redisInstance.setTransactionRedis({
      externalTransactionId: result?.txid,
      market: 'kraken',
      amountToBuy: result?.amount[0],
      price: result?.result?.[result.txid].price,
      asset: this.asset,
      status: result?.result?.[result.txid].status,
      type: ActionType.SPOT_SELL,
      balanceType: 'spot',
      value: result?.amount[0],
    });
    console.log('SpotSell: ', result);
  }
  async futureBuy(): Promise<void> {
    const result = await this.service.futureBuy(this.amountToBuy, this.asset);
    await redisInstance.setTransactionRedis({
      externalTransactionId: result?.sendStatus?.order_id,
      market: 'kraken',
      amountToBuy: this.amountToBuy,
      price: result?.sendStatus?.orderEvents[0]?.price,
      asset: result?.sendStatus?.orderEvents[0]?.orderPriorExecution?.symbol,
      status: result?.sendStatus?.status,
      type: ActionType.FUTURE_BUY,
      balanceType: 'futures',
      value: Number(result?.sendStatus?.orderEvents[0]?.amount),
    });
    console.log('FutureBuy: ', result);
  }
  async futureSell(amountToSell?: any): Promise<void> {
    const amount = amountToSell ? amountToSell : this.amountToBuy;
    const result = await this.service.futureSell(amount, this.asset);
    await redisInstance.setTransactionRedis({
      externalTransactionId: result?.sendStatus?.order_id,
      market: 'kraken',
      amountToBuy: result?.sendStatus?.orderEvents[0]?.amount,
      price: result?.sendStatus?.orderEvents[0]?.price,
      asset: result?.sendStatus?.orderEvents[0]?.orderPriorExecution?.symbol,
      status: result?.sendStatus?.status,
      type: ActionType.FUTURE_SELL,
      balanceType: 'futures',
      value: Number(result?.sendStatus?.orderEvents[0]?.amount),
    });
    console.log('FutureSell ', result);
  }

  async check(): Promise<void> {
    const result = await this.service.check(this.asset || 'usdt');
    console.log('Spot Balance ---', result);
  }

  async checkFuture(): Promise<string> {
    const result = await this.service.checkFuture('usdt');
    console.log('CheckFuture: ', result['usdt']);
    return result['usdt'];
  }
  async walletTransfer(redisBalance: string): Promise<void> {
    console.log(redisBalance);
    const result = await this.service.walletTransfer(
      'usdt',
      String(parseInt(redisBalance)),
      KrakenWallets.SPOT,
      KrakenWallets.FUTURES,
    );
    await redisInstance.set(
      {
        key: 'balance',
        marketName: 'kraken',
        balanceType: 'spot',
        asset: 'usdt',
        value: '0',
      },
      300,
    );
    await redisInstance.setTransactionRedis({
      externalTransactionId: result?.data?.result?.refid,
      market: 'kraken',
      amountToBuy: redisBalance,
      price: 'undefined',
      asset: 'usdt',
      status: 'success',
      type: ActionType.TRANSFER,
      balanceType: 'spot',
      value: redisBalance,
    });
    console.log('Transfer Spot', result);
  }

  async futureWalletTransfer(): Promise<void> {
    const balance = await this.checkFuture();
    const result = await this.service.futureWalletTransfer(
      'usdt',
      balance,
      'flex',
    );
    await redisInstance.setTransactionRedis({
      externalTransactionId: result?.data?.result?.refid,
      market: 'kraken',
      amountToBuy: balance,
      price: 'undefined',
      asset: 'usdt',
      status: 'success',
      type: ActionType.TRANSFER,
      balanceType: 'futures',
      value: balance,
    });
    console.log('Transfer Futures Balance ---', result);
  }

  async getDepositAddress(): Promise<void> {}

  async getDepositMethods(): Promise<void> {}

  async getInitialAssetState() {
    const result = await this.check();
    return result[this.asset];
  }

  async checkReceivedAsset() {
    let prevResult = Number(await this.getInitialAssetState());

    setInterval(async () => {
      const result = await this.check();
      const currentResult = Number(result[this.asset]);
      console.log('current:', currentResult, 'prev:', prevResult);
      if (currentResult !== prevResult) {
        await this.sell(currentResult); // need to set redis data
        await this.futureSell(); // need to set redis data
      }
      prevResult = currentResult;
    }, 30000);
  }
}
