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
import { KrakenFlow } from './fabric/kraken/flow/krakenFlow';

colors.enable();

@Injectable()
export class AppService {
  markets = {
    binance: {
      service: this.binanceService,
      factory: '',
    },
    kraken: {
      service: this.krakenService,
      factory: KrakenFlow,
    },
    crypto: {
      service: this.cryptoService,
      factory: '',
    },
    // okex: this.okexService,
  };
  constructor(
    private readonly binanceService: BinanceService,
    private readonly krakenService: KrakenService,
    private readonly cryptoService: CryptoService,
    private readonly okexService: OkexService,
  ) {
    for (let market in this.markets) {
      if (market === 'crypto' || market === 'kraken') {
        continue;
      }
      this.getMarketsBalance(market, 'check', 'spot');
      this.getMarketsBalance(market, 'checkFuture', 'futures');
    }
    setTimeout(() => {
      this.makeAction({
        amountToBuy: '0.02',
        asset: 'ETH',
        aproxStableValue: '16',
        marketHigh: MarketType.BINANCE,
        marketLow: MarketType.KRAKEN,
      });
    }, 500);
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
      const low: Market = new this.markets[marketLow].factory().getMarket(
        amountToBuy,
        asset,
        aproxStableValue,
        this.markets[marketLow].service,
      );

      // const high: Market = new this.markets[marketHigh].factory().getMarket(
      //   amountToBuy,
      //   asset,
      //   aproxStableValue,
      //   this.markets[marketHigh].service,
      // );

      if (Number(redisBalance)) {
        // low.walletTransfer(redisBalance);
        // low.check();
        low.futureWalletTransfer();
        console.log(redisBalance);
        //   if (Number(redisBalance) > 30) {
        //     const spotResult = await this.markets[marketLow]['buy'](
        //       marketLow == 'binance' ? redisBalance : amountToBuy,
        //       asset,
        //       aproxStableValue,
        //     );
        //     await this.setTransactionRedis({
        //       externalTransactionId: spotResult?.txid,
        //       market: marketLow,
        //       amountToBuy,
        //       price: spotResult?.result?.price,
        //       asset,
        //       status: spotResult?.result?.status,
        //       type: ActionType.SPOT_BUY,
        //       balanceType: 'spot',
        //       value:
        //         Number(redisBalance) -
        //         (Number(spotResult?.result?.cost) +
        //           Number(spotResult?.result?.fee)),
        //     });

        //     if (marketLow === 'kraken') {
        //       const transferResult = await this.markets[marketLow][
        //         'walletTransfer'
        //       ]('usdt', redisBalance, KrakenWallets.SPOT, KrakenWallets.FUTURES);
        //       if (transferResult.data?.result?.refid) {
        //         await redisInstance.set(
        //           {
        //             key: 'balance',
        //             marketName: marketLow,
        //             balanceType: 'spot',
        //             asset: 'usdt',
        //             value: '0',
        //           },
        //           300,
        //         );
        //         await this.setTransactionRedis({
        //           externalTransactionId: transferResult.data?.result?.refid,
        //           market: marketLow,
        //           amountToBuy: redisBalance,
        //           price: 'undefined',
        //           asset: 'usdt',
        //           status: 'success',
        //           type: ActionType.TRANSFER,
        //           balanceType: 'spot',
        //           value: redisBalance,
        //         });
        //         const futureResult = await this.markets[marketHigh]['futureBuy'](
        //           amountToBuy,
        //           asset,
        //         );
        //         await this.setTransactionRedis({
        //           externalTransactionId: futureResult?.sendStatus?.order_id,
        //           market: marketLow,
        //           amountToBuy,
        //           price: futureResult?.sendStatus?.orderEvents[0]?.price,
        //           asset:
        //             futureResult?.sendStatus?.orderEvents[0]?.orderPriorExecution
        //               ?.symbol,
        //           status: futureResult?.sendStatus?.status,
        //           type: ActionType.FUTURE_BUY,
        //           balanceType: 'futures',
        //           value: Number(futureResult?.sendStatus?.orderEvents[0]?.amount),
        //         });
        //       }
        //       const futureSellResult = await this.markets[marketLow]['futureSell'](
        //         amountToBuy,
        //         asset,
        //       );
        //       await this.setTransactionRedis({
        //         externalTransactionId: futureSellResult?.sendStatus?.order_id,
        //         market: marketLow,
        //         amountToBuy: futureSellResult?.sendStatus?.orderEvents[0]?.amount,
        //         price: futureSellResult?.sendStatus?.orderEvents[0]?.price,
        //         asset:
        //           futureSellResult?.sendStatus?.orderEvents[0]?.orderPriorExecution
        //             ?.symbol,
        //         status: futureSellResult?.sendStatus?.status,
        //         type: ActionType.FUTURE_SELL,
        //         balanceType: 'futures',
        //         value: Number(futureSellResult?.sendStatus?.orderEvents[0]?.amount),
        //       });
        //       await this.markets[marketLow]['checkFuture'](asset).then(
        //         (response) => {
        //           if (response) {
        //             redisBalance = response[asset];
        //           }
        //         },
        //       );
        //       const futureBalance: string = await redisInstance.get(
        //         redisInstance.generateRedisKey({
        //           key: 'balance',
        //           marketName: marketLow,
        //           balanceType: 'futures',
        //           asset: 'usdt',
        //         }),
        //       );
        //       const transferBackToSpot = await this.markets[marketLow][
        //         'futureWalletTransfer'
        //       ]('usdt', futureBalance);
        //       if (transferBackToSpot) {
        //         await redisInstance.set(
        //           {
        //             key: 'balance',
        //             marketName: marketLow,
        //             balanceType: 'spot',
        //             asset: 'futures',
        //             value: redisBalance,
        //           },
        //           300,
        //         );
        //         await this.setTransactionRedis({
        //           externalTransactionId: transferBackToSpot?.data?.result?.refid,
        //           market: marketLow,
        //           amountToBuy: redisBalance,
        //           price: 'undefined',
        //           asset: 'usdt',
        //           status: 'success',
        //           type: ActionType.TRANSFER,
        //           balanceType: 'futures',
        //           value: redisBalance,
        //         });
        //       }
        //       const sellResult = await this.markets[marketHigh]['sell'](
        //         amountToBuy,
        //         asset.toUpperCase(),
        //       );
        //       await this.setTransactionRedis({
        //         externalTransactionId: sellResult.txid,
        //         market: marketLow,
        //         amountToBuy: spotResult.amount[0],
        //         price: spotResult.result[spotResult.txid].price,
        //         asset,
        //         status: spotResult.result[spotResult.txid].status,
        //         type: ActionType.SPOT_SELL,
        //         balanceType: 'spot',
        //         value: spotResult.amount[0],
        //       });
        //     }

        //     //binance spot buy to redis
        //     await this.setTransactionRedis({
        //       externalTransactionId: spotResult.orderId,
        //       market: marketLow,
        //       amountToBuy: spotResult.origQty,
        //       price: spotResult.fills[0].price,
        //       asset: spotResult.symbol,
        //       status: spotResult.status,
        //       type: ActionType.SPOT_BUY,
        //       balanceType: 'spot',
        //       value: Number(redisBalance) - Number(spotResult?.cummulativeQuoteQty),
        //     });

        //     // biance spot sell
        //     await this.setTransactionRedis(
        //       await this.markets[marketLow]['sell']('ETH', redisBalance),
        //     );

        //     try {
        //       let redisFutureBalance: string = await redisInstance.get(
        //         redisInstance.generateRedisKey({
        //           key: 'balance',
        //           marketName: marketHigh,
        //           balanceType: 'futures',
        //           asset: 'bnfcr',
        //         }),
        //       );

        //       // binace future buy
        //       await this.setTransactionRedis(
        //         await this.markets[marketHigh].futureBuy(
        //           Number(spotResult.origQty).toFixed(3),
        //           asset,
        //           redisFutureBalance,
        //         ),
        //       );

        //       // binance future sell
        //       await this.setTransactionRedis(
        //         await this.markets[marketHigh].futureSell(
        //           asset,
        //           redisFutureBalance,
        //         ),
        //       );
        //     } catch (error) {
        //       log(error);
        //     }
        //   }
        // } catch (error) {
        //   log(error);
        // }

        // try {
        //   const redisBalance: string = await redisInstance.get(
        //     redisInstance.generateRedisKey({
        //       key: 'balance',
        //       marketName: marketHigh,
        //       balanceType: 'spot',
        //       asset: 'usdt',
        //     }),
        //   );
        //   if (marketHigh == 'binance') {
        //     const futureBuyResult = await this.markets[
        //       marketHigh
        //     ].service.futureBuy(redisBalance, asset, aproxStableValue);
        //     if (futureBuyResult) {
        //       const remainingBalance = futureBuyResult.remainingBalance;
        //       const result = futureBuyResult.futureBuyResponse;
        //       await this.setTransactionRedis({
        //         externalTransactionId: result.orderId,
        //         market: marketHigh,
        //         amountToBuy: result.origQty,
        //         price: Number(redisBalance) - Number(remainingBalance),
        //         asset: result.symbol,
        //         status: result.status,
        //         type: ActionType.FUTURE_BUY,
        //         balanceType: 'spot',
        //         value: remainingBalance,
        //       });
        //       console.log(await redisInstance.get('balance-binance-spot-usdt'));
        //     }
        //   }
        // } catch (error) {
        //   log(error);
        // }

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
    } catch (e) {
      console.log(e);
    }
  }
  async getMarketsBalance(
    market: string,
    method: string,
    type: string,
    asset: string = 'usdt',
  ) {
    await this.markets[market].service[method](asset).then((response: any) => {
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
  // async setTransactionRedis({
  //   externalTransactionId,
  //   market,
  //   amountToBuy,
  //   price,
  //   asset,
  //   status,
  //   type,
  //   balanceType,
  //   value,
  // }): Promise<void> {
  //   await redisInstance.set(
  //     {
  //       key: 'action',
  //       transactionId: randomUUID(),
  //       value: {
  //         response: {
  //           [market]: [
  //             {
  //               externalTransactionId,
  //               amount: Number(amountToBuy),
  //               assetPrice: Number(price),
  //               assetName: asset,
  //               date: new Date(),
  //               status,
  //               type,
  //             },
  //           ],
  //         },
  //       },
  //     },
  //     300,
  //   );
  //   await redisInstance.set(
  //     {
  //       key: 'balance',
  //       marketName: market,
  //       balanceType,
  //       asset: 'usdt',
  //       value,
  //     },
  //     300,
  //   );
  // }
}
