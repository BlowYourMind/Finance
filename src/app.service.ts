import { Injectable } from '@nestjs/common';
import { BinanceService } from './binance/binance.service';
import { CryptoService } from './crypto/crypto.service';
import { ActionInfo } from './dto/makeTrade.dto';
import { OkexService } from './okex/okex.service';
import * as colors from 'colors';
import { redisInstance } from './redis/redis.service';
import { log } from 'console';
import { MarketType } from './dto/marketType.dto';
import { BinanceFlow } from './fabric/binance/flow/binanceFlow';
import { Market } from './interfaces/market.interface';
import { KucoinService } from './kucoin/kucoin.service';
import { KucoinFlow } from './fabric/kucoin/flow/kucoinFlow';

colors.enable();

@Injectable()
export class AppService {
  markets = {
    binance: {
      service: this.binanceService,
      factory: BinanceFlow,
    },
    // crypto: {
    //   service: this.cryptoService,
    //   factory: '',
    // },
    kucoin: {
      service: this.kuCoinService,
      factory: KucoinFlow,
    },
  };
  constructor(
    private readonly binanceService: BinanceService,
    private readonly cryptoService: CryptoService,
    private readonly kuCoinService: KucoinService,
    private readonly okexService: OkexService,
  ) {
    for (let market in this.markets) {
      this.getMarketsBalance(market, 'check', 'spot');

      if (market === 'binance') continue;
      this.getMarketsBalance(market, 'checkFuture', 'futures');
    }
    setTimeout(() => {
      this.makeAction({
        amountToBuy: '0.005',
        asset: 'ETH',
        aproxStableValue: '16',
        marketHigh: MarketType.KUCOIN,
        marketLow: MarketType.BINANCE,
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
    const redisSpotBalance: string = await redisInstance.get(
      redisInstance.generateRedisKey({
        key: 'balance',
        marketName: marketLow,
        balanceType: 'spot',
        asset: 'usdt',
      }),
    );
    const redisFuturesBalance: string = await redisInstance.get(
      redisInstance.generateRedisKey({
        key: 'balance',
        marketName: marketHigh,
        balanceType: 'futures',
        asset: 'usdt',
      }),
    );
    const low: Market = await new this.markets[marketLow].factory().getMarket(
      amountToBuy,
      asset,
      aproxStableValue,
      redisSpotBalance,
      redisFuturesBalance,
      this.markets[marketLow].service,
    );
    const high: Market = await new this.markets[marketHigh].factory().getMarket(
      amountToBuy,
      asset,
      aproxStableValue,
      redisSpotBalance,
      redisFuturesBalance,
      this.markets[marketHigh].service,
    );
    // low.transfer(high);
    // low.buy()
    // high.buy();
    // low.buy();
    // if (Number(redisBalance)) {
    // low.buy();
    // low.transfer(high);
    // }
  }
  async getMarketsBalance(
    market: string,
    method: string,
    type: string,
    asset: string = 'usdt',
  ) {
    await this.markets[market].service[method](asset).then((response: any) => {
      if (response) {
        const asset = Object.keys(response)[0].toLowerCase();
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
}
