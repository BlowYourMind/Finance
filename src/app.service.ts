import { Get, Injectable } from '@nestjs/common';
import { BinanceService } from './binance/binance.service';
import { CryptoService } from './crypto/crypto.service';
import { ActionInfo } from './dto/makeTrade.dto';
import { KrakenService } from './kraken/kraken.service';
import { OkexService } from './okex/okex.service';
import * as colors from 'colors';
import Redis from 'ioredis';
colors.enable();

@Injectable()
export class AppService {
  markets = {
    binance: this.binanceService,
    kraken: this.krakenService,
    crypto: this.cryptoService,
    okex: this.okexService,
  };
  client: Redis;
  constructor(
    private readonly binanceService: BinanceService,
    private readonly krakenService: KrakenService,
    private readonly cryptoService: CryptoService,
    private readonly okexService: OkexService,
  ) {
    this.client = new Redis({
      host: '38.242.203.151',
      password: 'andjf8*d@GS',
      port: 6379,
    });
    for (let market in this.markets) {
      if (market === 'crypto') {
        continue;
      }
      this.getMarketsBalance(market, 'check', 'spot');
      this.getMarketsBalance(market, 'checkFuture', 'future');
    }
    // this.makeAction({
    //   amountToBuy: '0.015',
    //   asset: 'ETH',
    //   aproxStableValue: '16',
    //   marketHigh: MarketType.BINANCE,
    //   marketLow: MarketType.OKEX,
    // });
  }
  async makeAction({
    marketHigh,
    marketLow,
    amountToBuy,
    asset,
    aproxStableValue,
  }: ActionInfo) {
    // Buy Low and Future Lock High
    await this.markets[marketLow]['buy'](amountToBuy, asset, aproxStableValue);
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

    // Get transfer address
    const address = await this.markets[marketHigh]['getDepositAddress'](
      asset,
      depositMethods[0].method,
    );

    // Transfer from Low to High
    await this.markets[marketLow]['transfer'](
      asset,
      amountToBuy,
      address.address,
    );
    // Sell High and Future Lock
    await this.markets[marketHigh]['sell'](amountToBuy, asset);
    await this.markets[marketHigh]['futureSell'](amountToBuy, asset);
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
          JSON.stringify(JSON.stringify(asset)),
          type,
          market,
        );
      }
    });
  }
  async initialiseRedisBalance(
    asset: string,
    balanceType: string,
    marketName: string,
  ): Promise<void> {
    const redisKey = `balance-${marketName}-${balanceType}-${asset}`;
    if (await this.client.get(redisKey)) {
      await this.client.del(redisKey);
    }
    await this.client.set(redisKey, asset);
    await this.client.expire(redisKey, 300);
  }
}
