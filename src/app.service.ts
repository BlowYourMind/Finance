import { Get, Injectable } from '@nestjs/common';
import { BinanceService } from './binance/binance.service';
import { CryptoService } from './crypto/crypto.service';
import { ActionInfo } from './dto/makeTrade.dto';
import { KrakenService } from './kraken/kraken.service';
import { OkexService } from './okex/okex.service';
import { log } from 'console';
import { CatchAll } from './try.decorator';
import * as colors from 'colors';
import { Cron, CronExpression } from '@nestjs/schedule';
import { response } from 'express';
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
    // this.makeAction({
    //   amountToBuy: '0.015',
    //   asset: 'ETH',
    //   aproxStableValue: '16',
    //   marketHigh: MarketType.BINANCE,
    //   marketLow: MarketType.OKEX,
    // });
    this.krakenService.check('usdt').then((response: any) => {
      if (response) {
        this.krakenService.initializeRedisBalance(
          JSON.stringify(response),
          'spot',
        );
      }
    });
    // this.okexService.check('usdt').then((response: any) => {
    //   if (response) {
    //     console.log(response);
    //   }
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
}
