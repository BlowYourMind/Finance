import { Injectable } from '@nestjs/common';
import { BinanceService } from './binance/binance.service';
import { CryptoService } from './crypto/crypto.service';
import { ActionInfo } from './dto/makeTrade.dto';
import { KrakenService } from './kraken/kraken.service';
import { OkexService } from './okex/okex.service';
import { log } from 'console';
import { MarketType } from './dto/marketType.dto';
import { OkexWallets } from './dto/okex.dto';

type ActionType = 'sell' | 'buy' | 'check' | 'futureSell' | 'futureBuy';

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
  }

  async checkBalance(market: MarketType) {
    // return await this.markets[market].check();
  }
  // dai1dbja@futures-demo.com
  // 6g6diy6yk4w1lb39gco2
  // Kraken pub test key WEj18MfpF/QNL6iEYfqAfrQBVu0/f/ytRjuN2+2whm+DaD3EJvFdMjbR
  // Kraken sec test ley L9TYAYJpDliwYTUUxgRqipGPnj/3bRKLMrUNM77LsN+gMVruTdmytZjG4PlLZz8hlxOqj0hJxGFYYt+24ADJDD9c

  async calculateAmountExpected(info: ActionInfo, spotBuy: any) {
    switch (info.marketLow) {
      case MarketType.BINANCE:
        log(spotBuy);
        return Number(spotBuy.fills[0].qty);
      case MarketType.OKEX:
        const orderInfo = await this.markets[info.marketLow]['getOrder'](spotBuy.ordId, info.asset + '-USDT');
        return Number(info.amountToBuy) + Number(orderInfo.fee);
      case MarketType.KRAKEN:
        return Number(info.amountToBuy);
    }
  }

  async makeFutureAction(info: ActionInfo) {

    // const spotBuy = await this.markets[info.marketLow]['buy'](info.amountToBuy, info.asset);
    
    // const amountExpected = await this.calculateAmountExpected(info, spotBuy);

    // this.detectBalanceChange(info, amountExpected, async (balance: string) => {
    //   log(balance)
    //   switch (info.marketLow) {
    //     case MarketType.OKEX:
    //       await this.markets[info.marketLow]['moveFundsFromTo'](balance, info.asset, OkexWallets.TRADING, OkexWallets.FUNDING);
    //       break;
    //     case MarketType.BINANCE:
    //       break;
    //     case MarketType.KRAKEN:
    //       break;
    //   }
    // });

    // const futureBuy = await this.markets[info.marketHigh]['futureBuy'](info.amountToBuy, info.asset);
    // log(futureBuy);

    // const tempFutureInterval = setInterval(async () => {
    //   const balance = await this.markets[info.marketHigh].check(info.asset);
    //   if(Number(balance[info.asset.toLowerCase()]) >= Number(spotBuy.fills[0].qty)) {
    //   //  log('Detected sufficient balance change')
    //     clearInterval(tempFutureInterval);
    //   }
    // }, 5000);
    const method = await this.markets[MarketType.KRAKEN]['getDepositMethods'](info.asset);
    console.log(method[1]);

    let krakenAddress = await this.markets[MarketType.KRAKEN].getDepositAddress(info.asset, method[1].method);
    if(!krakenAddress || !krakenAddress[0]) {
      log('Error getting kraken address');
      krakenAddress = await this.markets[MarketType.KRAKEN].getDepositAddress(info.asset, method[1].method, true); 
    }

    log(await this.markets[MarketType.BINANCE].getCapitalConfig('ETH'));
    this.markets[MarketType.BINANCE].makeWithdrawal(info.amountToBuy, 'ETH', krakenAddress[0].address, )

    log(krakenAddress[0]);

  }

  async detectBalanceChange(info: ActionInfo, amountExpected: number, callback: (balance: string) => void) {
    const tempWalletInterval = setInterval(async () => {
      const balance = await this.markets[info.marketLow].check(info.asset);
      if (Number(balance[info.asset.toLowerCase()]) >= amountExpected) {
        clearInterval(tempWalletInterval);
        callback(balance[info.asset.toLowerCase()]);
      }
    }, 5000);


  }
}
