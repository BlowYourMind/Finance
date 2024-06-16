import { Injectable } from '@nestjs/common';
import { BinanceService } from './binance/binance.service';
import { CryptoService } from './crypto/crypto.service';
import { ActionInfo } from './dto/makeTrade.dto';
import { KrakenService } from './kraken/kraken.service';
import { OkexService } from './okex/okex.service';
import * as colors from 'colors';
import { ActionType, redisInstance } from './redis/redis.service';
import { log } from 'console';
import { MarketType } from './dto/marketType.dto';
import { randomUUID } from 'crypto';

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

    setTimeout(() => {
      this.makeAction({
        amountToBuy: '0.02',
        asset: 'ETH',
        aproxStableValue: '16',
        marketHigh: MarketType.BINANCE,
        marketLow: MarketType.BINANCE,
      });
    }, 2000);
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
      const redisBalance: string = await redisInstance.get(
        redisInstance.generateRedisKey({
          key: 'balance',
          marketName: marketLow,
          balanceType: 'spot',
          asset: 'usdt',
        }),
      );

      console.log(redisBalance);
      if (Number(redisBalance) > 50) {
        const result = await this.markets[marketLow]['buy'](
          redisBalance, // amountToBuy changed to redisBalance | We need to buy for all available money
          asset,
          aproxStableValue,
        );
        // if (marketLow === 'okex') {
        //   // USDT/USDC => ETH/USDC
        //   // ETH/EUR only
        //   console.log(result);
        //   //Trading of this pair or contract is restricted due to local compliance requirements
        // }
        if (marketLow === 'kraken') {
          await this.setTransactionRedis({
            externalTransactionId: result?.txid,
            market: marketLow,
            amountToBuy,
            price: result?.result?.price,
            asset,
            status: result?.result?.status,
            type: ActionType.SPOT_BUY,
            balanceType: 'spot',
            value:
              Number(redisBalance) -
              (Number(result?.result?.cost) + Number(result?.result?.fee)),
          });
        }
        if (marketLow === 'binance') {
          await this.setTransactionRedis({
            externalTransactionId: result.orderId,
            market: marketLow,
            amountToBuy: result.origQty,
            price: result.fills[0].price,
            asset: result.symbol,
            status: result.status,
            type: ActionType.SPOT_BUY,
            balanceType: 'spot',
            value: Number(redisBalance) - Number(result?.cummulativeQuoteQty),
          });
        }
      }
    } catch (error) {
      log(error);
    }

    try {
      const redisBalance: string = await redisInstance.get(
        redisInstance.generateRedisKey({
          key: 'balance',
          marketName: marketHigh,
          balanceType: 'spot',
          asset: 'usdt',
        }),
      );
      if (marketHigh == 'binance') {
        const futureBuyResult = await this.markets[marketHigh].futureBuy(
          redisBalance,
          asset,
          aproxStableValue,
        );
        if (futureBuyResult) {
          const remainingBalance = futureBuyResult.remainingBalance;
          const result = futureBuyResult.futureBuyResponse;
          await this.setTransactionRedis({
            externalTransactionId: result.orderId,
            market: marketHigh,
            amountToBuy: result.origQty,
            price: Number(redisBalance) - Number(remainingBalance),
            asset: result.symbol,
            status: result.status,
            type: ActionType.FUTURE_BUY,
            balanceType: 'spot',
            value: remainingBalance,
          });
          console.log(await redisInstance.get('balance-binance-spot-usdt'));
        }
      }
    } catch (error) {
      log(error);
    }
    // await this.markets[marketHigh]['futureBuy'](
    //   amountToBuy,
    //   asset,
    //   aproxStableValue,
    // );
    // TODO: CHECK ASSET PRICE DELTA

    // Get deposit network/method
    // const depositMethods = await this.markets[marketHigh]['getDepositMethods'](
    //   asset,
    // );

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
    value: string,
  ): Promise<void> {
    await redisInstance.set(
      { key, marketName, balanceType, asset, value },
      300,
    );
  }
  async setTransactionRedis({
    externalTransactionId,
    market,
    amountToBuy,
    price,
    asset,
    status,
    type,
    balanceType,
    value,
  }): Promise<void> {
    await redisInstance.set(
      {
        key: 'action',
        transactionId: randomUUID(),
        value: {
          response: {
            [market]: [
              {
                externalTransactionId,
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
        value,
      },
      300,
    );
  }
}
