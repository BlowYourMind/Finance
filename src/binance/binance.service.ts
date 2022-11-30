import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { balanceInfo } from 'src/dto/balance.dto';
import { SignatureService } from 'src/signature/signature.service';

@Injectable()
export class BinanceService {
  constructor(
    private readonly httpService: HttpService,
    private readonly signatureService: SignatureService,
  ) { }
  async buy(amount: string) {
    const params = {
      symbol: 'ETHUSDT',
      side: 'BUY',
      type: 'MARKET',
      quantity: amount,
      timestamp: Date.now().toString(),
    };
    const query = new URLSearchParams({
      ...params,
      signature: this.signatureService.encryptBinanceData(
        new URLSearchParams(params).toString(),
        '2YG7NqWK1WSzcEsPcQFeUNQWOK7AQ77EIzCBqG0euQWUASXd45bqhf3kFKtGuUi2',
      ),
    });
    try {
      const res = await firstValueFrom(
        await this.httpService.post(
          'https://api1.binance.com/api/v3/order?' +
          new URLSearchParams(query).toString(),
          '',
          {
            headers: {
              'X-MBX-APIKEY':
                '3R0WLL5rpdZmcHhm93wXsrVQ869s6dRltxW4S6DOkDxhcrJhm2sDCrKmdnO6JQBn',
            },
          },
        ),
      );
      console.log(res.data);
    } catch (e) {
      if (e.data) {
        console.log(e.data);
      } else {
        console.log(e);
      }

      return e;
    }
  }

  async sell(amount: string) {
    const params = {
      symbol: 'ETHUSDT',
      side: 'SELL',
      type: 'MARKET',
      quantity: amount,
      timestamp: Date.now().toString(),
    };
    const query = new URLSearchParams({
      ...params,
      signature: this.signatureService.encryptBinanceData(
        new URLSearchParams(params).toString(),
        '2YG7NqWK1WSzcEsPcQFeUNQWOK7AQ77EIzCBqG0euQWUASXd45bqhf3kFKtGuUi2',
      ),
    });
    try {
      const res = await firstValueFrom(
        await this.httpService.post(
          'https://api1.binance.com/api/v3/order?' +
          new URLSearchParams(query).toString(),
          '',
          {
            headers: {
              'X-MBX-APIKEY':
                '3R0WLL5rpdZmcHhm93wXsrVQ869s6dRltxW4S6DOkDxhcrJhm2sDCrKmdnO6JQBn',
            },
          },
        ),
      );
      console.log(res.data);
    } catch (e) {
      if (e.data) {
        console.log(e.data);
      } else {
        console.log(e);
      }

      return e;
    }
  }

  async check(): Promise<balanceInfo> {
    const params1 = {
      asset: 'ETH',
      timestamp: Date.now().toString(),
    };
    const query1 = new URLSearchParams({
      ...params1,
      signature: this.signatureService.encryptBinanceData(
        new URLSearchParams(params1).toString(),
        '2YG7NqWK1WSzcEsPcQFeUNQWOK7AQ77EIzCBqG0euQWUASXd45bqhf3kFKtGuUi2',
      ),
    });
    const params2 = {
      asset: 'USDT',
      timestamp: Date.now().toString(),
    };
    const query2 = new URLSearchParams({
      ...params2,
      signature: this.signatureService.encryptBinanceData(
        new URLSearchParams(params2).toString(),
        '2YG7NqWK1WSzcEsPcQFeUNQWOK7AQ77EIzCBqG0euQWUASXd45bqhf3kFKtGuUi2',
      ),
    });
    try {
      const ethBalance = await firstValueFrom(
        this.httpService.post(
          'https://api1.binance.com/sapi/v3/asset/getUserAsset?' + query1,
          {},
          {
            headers: {
              'X-MBX-APIKEY':
                '3R0WLL5rpdZmcHhm93wXsrVQ869s6dRltxW4S6DOkDxhcrJhm2sDCrKmdnO6JQBn',
            },
          },
        ),
      );
      const usdtBalance = await firstValueFrom(
        this.httpService.post(
          'https://api1.binance.com/sapi/v3/asset/getUserAsset?' + query2,
          {},
          {
            headers: {
              'X-MBX-APIKEY':
                '3R0WLL5rpdZmcHhm93wXsrVQ869s6dRltxW4S6DOkDxhcrJhm2sDCrKmdnO6JQBn',
            },
          },
        ),
      );
      console.log({ eth: ethBalance.data[0].free, usdt: usdtBalance.data[0].free });

      return { eth: ethBalance.data[0].free, usdt: usdtBalance.data[0].free };
    } catch (e) {
      return e;
    }
  }
}
