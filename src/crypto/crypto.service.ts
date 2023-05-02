import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { balanceInfo } from 'src/dto/balance.dto';

@Injectable()
export class CryptoService {
  constructor(private readonly httpService: HttpService) {}
 async futureBuy(amount: string, asset:string) {
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
    console.log('check');
    return {
      eth: '0.00',
      usdt: '0.00000000',
    };
  }
}
