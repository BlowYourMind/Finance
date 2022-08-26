import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { balanceInfo } from 'src/dto/balance.dto';
import { SignatureService } from 'src/signature/signature.service';

@Injectable()
export class KrakenService {
  constructor(
    private readonly httpService: HttpService,
    private readonly signatureService: SignatureService,
  ) {}

  async buy(amount: string) {
    console.log('bought');
    return;
    return firstValueFrom(
      this.httpService.post(
        'https://api1.binance.com/api/v3/order',
        {
          symbol: 'BTCUSDT',
          side: 'BUY',
          type: 'MARKET',
          quantity: amount,
        },
        { headers: {} },
      ),
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
    const nonce = Date.now();
    const signature = this.signatureService.encryptKrakenData(
      '/0/private/Balance',
      {},
      'xdcpQzN/0uG0qLl/FQ+slDgLsklUjdqSHLbNRQP5bTzSmj3fyi8VX2WzTmiQqJxBuwnXq/bkqwASfORlI+KVZg==',
      nonce,
    );
    const postData = new URLSearchParams({ nonce: nonce.toString() });

    const balance = await firstValueFrom(
      this.httpService.post(
        'https://api.kraken.com/0/private/Balance',
        postData,
        {
          headers: {
            'API-Key':
              'JF/qGM+u1xU5gulW7ks3JrnQpiRfZ6TlW03I9ELY3v4P0sDbEqmcM0K2',
            'API-Sign': signature,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      ),
    );
    return { sol: balance.data.result.SOL, usdt: balance.data.result.ZUSD };
  }
}
