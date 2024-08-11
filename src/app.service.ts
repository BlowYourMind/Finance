import { Injectable } from '@nestjs/common';
import { BinanceService } from './binance/binance.service';
import { CryptoService } from './crypto/crypto.service';
import { ActionInfo } from './dto/makeTrade.dto';
import { KrakenService } from './kraken/kraken.service';
import { OkexService } from './okex/okex.service';
import * as colors from 'colors';
import { redisInstance } from './redis/redis.service';
import { log } from 'console';
import { MarketType } from './dto/marketType.dto';
import { KrakenFlow } from './fabric/kraken/flow/krakenFlow';
import { BinanceFlow } from './fabric/binance/flow/binanceFlow';

colors.enable();

@Injectable()
export class AppService {
  markets = {
    binance: {
      service: this.binanceService,
      factory: BinanceFlow,
    },
    kraken: {
      service: this.krakenService,
      factory: KrakenFlow,
    },
    crypto: {
      service: this.cryptoService,
      factory: '',
    },
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
      this.getMarketsBalance(market, 'checkFuture', 'futures');
    }
    setTimeout(() => {
      this.makeAction({
        amountToBuy: '0.01',
        asset: 'ETH',
        aproxStableValue: '16',
        marketHigh: MarketType.KRAKEN,
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

      const high: Market = new this.markets[marketHigh].factory().getMarket(
        amountToBuy,
        asset,
        aproxStableValue,
        this.markets[marketHigh].service,
      );
      if (Number(redisBalance)) {
        console.log(redisBalance);
        // high.futureSell();
        low.buy();
        // high.futureBuy();
        // setTimeout(() => {
        //   low.transfer();
        // }, 1000);
        // setTimeout(() => {
        //   high.checkReceivedAsset();
        // }, 2000);
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
}
