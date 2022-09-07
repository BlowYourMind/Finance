import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BinanceService } from './binance/binance.service';
import { CryptoService } from './crypto/crypto.service';
import { ActionInfo } from './dto/makeTrade.dto';
import { KrakenService } from './kraken/kraken.service';
import { OkexService } from './okex/okex.service';

@Injectable()
export class AppService {
  constructor(
    private readonly binanceService: BinanceService,
    private readonly krakenService: KrakenService,
    private readonly cryptoService: CryptoService,
    private readonly okexService: OkexService,
    @Inject('SCOUT-LEADER') private client: ClientProxy,
  ) { }
  buySellCheckIn = {
    // *******************************
    binance: async (
      amount: string,
      actionType: 'sell' | 'buy' | 'check',
    ): Promise<any | void> => {
      const response = await this.binanceService[actionType](amount);
      if (response) {
        return response;
      }
      return;
    },
    kraken: async (
      amount: string,
      actionType: 'sell' | 'buy' | 'check',
    ): Promise<any | void> => {
      const response = await this.krakenService[actionType](amount);
      if (response) {
        return response;
      }
      return;
    },
    crypto: async (
      amount: string,
      actionType: 'sell' | 'buy' | 'check',
    ): Promise<any | void> => {
      const response = await this.cryptoService[actionType](amount);
      if (response) {
        return response;
      }
      return;
    },
    okex: async (
      amount: string,
      actionType: 'sell' | 'buy' | 'check',
    ): Promise<any | void> => {
      const response = await this.okexService[actionType](amount);
      if (response) {
        return response;
      }
      return;
    },
  };

  async checkBalance(market: string) {
    return await this.buySellCheckIn[market]('1', 'check');
  }

  async makeAction(actionInfo: ActionInfo) {
    console.log(actionInfo);
    console.log('buying');

    await this.buySellCheckIn[actionInfo.marketLow](
      actionInfo.amountToBuy,
      'buy',
    );
    this.client.send({ cmd: 'market-price' }, { marketName: actionInfo.marketLow, action: "buy", asset: "SOL", currency: "USDT" });


    console.log('buying');

    await this.buySellCheckIn[actionInfo.marketHigh](
      actionInfo.amountToSell,
      'sell',
    );
    this.client.send({ cmd: 'market-price' }, { marketName: actionInfo.marketHigh, action: "buy", asset: "SOL", currency: "USDT" });
  }
}
