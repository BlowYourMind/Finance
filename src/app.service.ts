import { Get, Injectable } from '@nestjs/common';
import { BinanceService } from './binance/binance.service';
import { CryptoService } from './crypto/crypto.service';
import { ActionInfo } from './dto/makeTrade.dto';
import { KrakenService } from './kraken/kraken.service';
import { OkexService } from './okex/okex.service';
import * as colors from 'colors';
import { redisInstance } from './redis/redis.service';
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
        this.initialiseRedisBalance(asset, type, market, 'balance');
      }
    });
  }
  async initialiseRedisBalance(
    asset: string,
    balanceType: string,
    marketName: string,
    key: string,
  ): Promise<void> {
    await redisInstance.set({ key, marketName, balanceType, asset }, 300);
  }
}
