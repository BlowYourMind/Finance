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
  ) {}
  async buy(amount: string) {
    console.log('bought');
    return;
    return firstValueFrom(
      this.httpService.post('https://api1.binance.com/api/v3/order', {
        symbol: 'BTCUSDT',
        side: 'BUY',
        type: 'MARKET',
        quantity: amount,
      }),
    );
  }

  async sell(amount: string) {
    console.log('sold');
    return;
    return firstValueFrom(
      this.httpService.post('https://api1.binance.com/api/v3/order', {
        symbol: 'BTCUSDT',
        side: 'SELL',
        type: 'MARKET',
        quantity: amount,
      }),
    );
  }

  async check(): Promise<balanceInfo> {
    const params1 = {
      asset: 'SOL',
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
      const solBalance = await firstValueFrom(
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
      return { sol: solBalance.data[0].free, usdt: usdtBalance.data[0].free };
    } catch (e) {
      throw e;
    }
  }
}
