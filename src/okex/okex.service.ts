import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { balanceInfo } from 'src/dto/balance.dto';
import { SignatureService } from 'src/signature/signature.service';

@Injectable()
export class OkexService {
  constructor(
    private readonly httpService: HttpService,
    private readonly signatureService: SignatureService,
  ) {}

  async buy(amount: string) {
    const nonce = Date.now();
    const postData = new URLSearchParams({
      nonce: nonce.toString(),
      ordertype: 'market',
      type: 'buy',
      volume: amount,
      pair: 'SOLUSD',
    });
    const signature = this.signatureService.encryptKrakenData(
      '/0/private/AddOrder',
      postData,
      'xdcpQzN/0uG0qLl/FQ+slDgLsklUjdqSHLbNRQP5bTzSmj3fyi8VX2WzTmiQqJxBuwnXq/bkqwASfORlI+KVZg==',
      nonce,
    );
    try {
      const balance = await firstValueFrom(
        this.httpService.post(
          'https://api.kraken.com/0/private/AddOrder',
          postData,
          {
            headers: {
              'Content-Type': 'application/json',
              'OK-ACCESS-KEY': '988d9636-b941-4c1d-a3f1-81ff01140a33',
              'OK-ACCESS-SIGN': signature,
              'OK-ACCESS-PASSPHRASE': '!W#Q@E4t6r5y',
              'OK-ACCESS-TIMESTAMP': nonce,
              'x-simulated-trading': '0',
            },
          },
        ),
      );
      console.log(balance.data);
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
    const nonce = Date.now();
    const postData = new URLSearchParams({
      nonce: nonce.toString(),
      ordertype: 'market',
      type: 'sell',
      volume: amount,
      pair: 'SOLUSD',
    });
    const signature = this.signatureService.encryptKrakenData(
      '/0/private/AddOrder',
      postData,
      'xdcpQzN/0uG0qLl/FQ+slDgLsklUjdqSHLbNRQP5bTzSmj3fyi8VX2WzTmiQqJxBuwnXq/bkqwASfORlI+KVZg==',
      nonce,
    );
    try {
      const balance = await firstValueFrom(
        this.httpService.post(
          'https://api.kraken.com/0/private/AddOrder',
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
      console.log(balance.data);
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
    const nonce = Date.now().toString();
    console.log();

    const signature = this.signatureService.encryptOkexData(
      nonce,
      'GET',
      '/api/v5/account/balance',
      undefined,
    );
    try {
      const balance = await firstValueFrom(
        this.httpService.get('https://www.okex.com/api/v5/account/balance', {
          headers: {
            'OK-ACCESS-KEY': '988d9636-b941-4c1d-a3f1-81ff01140a33',
            'OK-ACCESS-SIGN': signature,
            'OK-ACCESS-PASSPHRASE': '!W#Q@E4t6r5y',
            'OK-ACCESS-TIMESTAMP': nonce,
          },
        }),
      );
      console.log(balance);

      return { sol: balance.data.result.SOL, usdt: balance.data.result.ZUSD };
    } catch (e) {
      console.log(e);

      return e;
    }
  }
}
