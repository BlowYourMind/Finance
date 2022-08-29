import { Injectable } from '@nestjs/common';
import { BinanceService } from './binance/binance.service';
import { CryptoService } from './crypto/crypto.service';
import { ActionInfo } from './dto/makeTrade.dto';
import { KrakenService } from './kraken/kraken.service';

@Injectable()
export class AppService {
  constructor(
    private readonly binanceService: BinanceService,
    private readonly krakenService: KrakenService,
    private readonly cryptoService: CryptoService,
  ) {}
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
  };

  async checkBalance(market: string) {
    return await this.buySellCheckIn[market]('1', 'check');
  }

  async makeAction(actionInfo: ActionInfo) {
    await this.buySellCheckIn[actionInfo.marketLow](
      actionInfo.tradePercentage,
      'buy',
    );
    await this.buySellCheckIn[actionInfo.marketHigh](
      actionInfo.tradePercentage,
      'sell',
    );
  }
}
