import { HttpService } from '@nestjs/axios';
import { BalanceInfo } from 'src/dto/balance.dto';
import { IAdapter } from 'src/interfaces/adapter.interface';
import * as ccxt from 'ccxt';

export class KucoinService implements IAdapter {
  private exchange: ccxt.kucoin;
  private futuresExchange: ccxt.kucoinfutures;

  constructor(private readonly httpService: HttpService) {
    const apiKey = process.env.KUCOIN_API_KEY;
    const secretKey = process.env.KUCOIN_SECRET;
    const passphrase = process.env.KUCOIN_PASSPHRASE;
    this.exchange = new ccxt.kucoin({
      apiKey: apiKey,
      secret: secretKey,
      password: passphrase,
      options: {
        defaultType: 'spot',
      },
    });
    this.futuresExchange = new ccxt.kucoinfutures({
      apiKey: apiKey,
      secret: secretKey,
      password: passphrase,
      options: {
        defaultType: 'future',
      },
    });
    this.exchange.options = {
      ...this.exchange.options,
      adjustForTimeDifference: true,
    };
    this.futuresExchange.options = {
      ...this.futuresExchange.options,
      adjustForTimeDifference: true,
    };
  }

  async check(asset: string): Promise<any> {
    try {
      const formattedAsset = asset.toUpperCase();
      const response = await this.exchange.fetchBalance({
        type: 'trade',
      });
      return { [formattedAsset]: response.free[formattedAsset] };
    } catch (error) {
      throw new Error(error);
    }
  }
  async checkFuture(asset?: string): Promise<any> | never {
    try {
      const formattedAsset = asset.toUpperCase();
      const response = await this.futuresExchange.fetchBalance({
        type: 'main',
      });
      return { [formattedAsset]: response.free[formattedAsset] };
    } catch (error) {
      throw new Error(error);
    }
  }
  futureBuy(
    amount: string,
    asset: string,
    approxStableValue: string,
  ): Promise<void | any> {
    throw new Error('Method not implemented.');
  }
  futureSell(amount: string, asset: string): Promise<void | any> {
    throw new Error('Method not implemented.');
  }
  delay(ms: number): Promise<any> {
    throw new Error('Method not implemented.');
  }
  async buy(
    amount: string,
    asset: string,
    approxStableValue: string,
  ): Promise<any> {
    try {
      const response = await this.exchange.createOrder(
        asset + '/USDT',
        'market',
        'buy',
        Number(amount),
      );
      return response;
    } catch (error) {
      throw new Error(error);
    }
  }
  async sell(amount: string, asset: string): Promise<void | any> {
    try {
      const response = await this.exchange.createOrder(
        asset + '/USDT',
        'market',
        'sell',
        Number(amount),
      );
      return response;
    } catch (error) {
      throw new Error(error);
    }
  }
  transfer(asset: string, amount: string, address: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  getDepositAddress(asset: string, isNew?: boolean): Promise<any> {
    throw new Error('Method not implemented.');
  }
  getDepositMethods(asset: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
