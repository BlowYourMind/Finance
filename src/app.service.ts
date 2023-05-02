import { Injectable } from '@nestjs/common';
import { BinanceService } from './binance/binance.service';
import { CryptoService } from './crypto/crypto.service';
import { ActionInfo } from './dto/makeTrade.dto';
import { KrakenService } from './kraken/kraken.service';
import { OkexService } from './okex/okex.service';
import { log } from 'console';
import { MarketType } from './dto/marketType.dto';

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
    return await this.markets[market].check();
  }
// dai1dbja@futures-demo.com
// 6g6diy6yk4w1lb39gco2
// Kraken pub test key WEj18MfpF/QNL6iEYfqAfrQBVu0/f/ytRjuN2+2whm+DaD3EJvFdMjbR
// Kraken sec test ley L9TYAYJpDliwYTUUxgRqipGPnj/3bRKLMrUNM77LsN+gMVruTdmytZjG4PlLZz8hlxOqj0hJxGFYYt+24ADJDD9c
  async makeFutureAction(info: ActionInfo) {

    // const spotBuy = await this.markets[info.marketLow]['buy'](info.amountToBuy, info.asset);
    // log(spotBuy);

    const futureBuy = await this.markets[info.marketHigh]['futureBuy'](info.amountToBuy, info.asset);
    log(futureBuy);

    
    // setInterval(async () => {
    //   await this.markets[info.marketHigh].check();
    // }, 5000);
    // console.log('buying');

  }
}
