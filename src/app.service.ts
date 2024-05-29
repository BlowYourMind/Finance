import { Get, Injectable } from '@nestjs/common';
import { BinanceService } from './binance/binance.service';
import { CryptoService } from './crypto/crypto.service';
import { ActionInfo } from './dto/makeTrade.dto';
import { KrakenService } from './kraken/kraken.service';
import { OkexService } from './okex/okex.service';
import * as colors from 'colors';
import { ActionType, redisInstance } from './redis/redis.service';
import { log } from 'console';
import { MarketType } from './dto/marketType.dto';
colors.enable();

@Injectable()
export class AppService {
  markets = {
    binance: this.binanceService,
    kraken: this.krakenService,
    crypto: this.cryptoService,
    okex: this.okexService,
  };
  constructor(
    private readonly binanceService: BinanceService,
    private readonly krakenService: KrakenService,
    private readonly cryptoService: CryptoService,
    private readonly okexService: OkexService,
  ) {
    for (let market in this.markets) {
      if (market === 'crypto') {
        continue;
      }
      this.getMarketsBalance(market, 'check', 'spot');
      this.getMarketsBalance(market, 'checkFuture', 'future');
    }

    // setTimeout(() => {
    //   this.makeAction({
    //     asset: 'ETH',
    //     aproxStableValue: '16',
    //     marketHigh: MarketType.BINANCE,
    //     marketLow: MarketType.BINANCE,
    //   });
    // }, 500);
  }
  async makeAction({
    amountToBuy,
    marketHigh,
    marketLow,
    asset,
    aproxStableValue,
  }: ActionInfo) {
    // Buy Low and Future Lock High
    try {
      const redisBalance = await redisInstance.get(
        redisInstance.generateRedisKey({
          key: 'balance',
          marketName: marketLow,
          balanceType: 'spot',
          asset: 'usdt',
        }),
      );
      if (Number(redisBalance) > 100) {
        const result = await this.markets[marketLow]['buy'](
          amountToBuy,
          asset,
          aproxStableValue,
        );
        if (marketLow === 'kraken') {
          await this.setTransactionRedis({
            transactionId: result?.txid,
            market: marketLow,
            amountToBuy,
            price: result?.result?.price,
            asset,
            status: result?.result?.status,
            type: ActionType.SPOT_BUY,
            balanceType: 'spot',
            balance:
              Number(redisBalance) -
              (Number(result?.result?.cost) + Number(result?.result?.fee)),
          });
        }
        if (marketLow === 'binance') {
          const currentBalance: number =
            Number(redisBalance) - Number(result?.cummulativeQuoteQty);
          await redisInstance.set(
            {
              asset: 'usdt',
              key: 'balance',
              marketName: marketLow,
              balanceType: 'spot',
              value: currentBalance,
            },
            300,
          );
        }
      }
    } catch (error) {
      log(error);
    }

    await this.markets[marketHigh]['futureBuy'](
      amountToBuy,
      asset,
      aproxStableValue,
    );
    // TODO: CHECK ASSET PRICE DELTA

    // Get deposit network/method
    const depositMethods = await this.markets[marketHigh]['getDepositMethods'](
      asset,
    );

    // // Buy Low and Future Lock High
    // await this.markets[marketLow]['buy'](amountToBuy, asset, aproxStableValue);
    // await this.markets[marketHigh]['futureBuy'](
    //   amountToBuy,
    //   asset,
    //   aproxStableValue,
    // );
    // // TODO: CHECK ASSET PRICE DELTA

    // // Get deposit network/method
    // const depositMethods = await this.markets[marketHigh]['getDepositMethods'](
    //   asset,
    // );

    // // Get transfer address
    // const address = await this.markets[marketHigh]['getDepositAddress'](
    //   asset,
    //   depositMethods[0].method,
    // );

    // // Transfer from Low to High
    // await this.markets[marketLow]['transfer'](
    //   asset,
    //   amountToBuy,
    //   address.address,
    // );
    // // Sell High and Future Lock
    // await this.markets[marketHigh]['sell'](amountToBuy, asset);
    // await this.markets[marketHigh]['futureSell'](amountToBuy, asset);
  }
  async getMarketsBalance(
    market: string,
    method: string,
    type: string,
    asset: string = 'usdt',
  ) {
    await this.markets[market][method](asset).then((response: any) => {
      if (response) {
        const asset = Object.keys(response)[0];
        this.initialiseRedisBalance(
          asset,
          type,
          market,
          'balance',
          response[asset],
        );
      }
    });
  }
  async initialiseRedisBalance(
    asset: string,
    balanceType: string,
    marketName: string,
    key: string,
    balance: string,
  ): Promise<void> {
    await redisInstance.set(
      { key, marketName, balanceType, asset, value: balance },
      300,
    );
  }
  async setTransactionRedis({
    transactionId,
    market,
    amountToBuy,
    price,
    asset,
    status,
    type,
    balanceType,
    balance,
  }): Promise<void> {
    await redisInstance.set(
      {
        key: 'action',
        transactionId,
        value: {
          response: {
            [market]: [
              {
                externalTransactionId: transactionId,
                amount: Number(amountToBuy),
                assetPrice: Number(price),
                assetName: asset,
                date: new Date(),
                status,
                type,
              },
            ],
          },
        },
      },
      300,
    );
    await redisInstance.set(
      {
        key: 'balance',
        marketName: market,
        balanceType,
        asset: 'usdt',
        value: balance,
      },
      300,
    );
  }
}
