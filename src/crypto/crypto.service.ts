import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CryptoService {
  constructor(private readonly httpService: HttpService) {}

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
  async check(): Promise<boolean> {
    console.log('check');
    return true;
  }
}
