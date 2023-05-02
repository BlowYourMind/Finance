import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { log } from 'console';
import { firstValueFrom } from 'rxjs';
import { balanceInfo } from 'src/dto/balance.dto';
import { SignatureService } from 'src/signature/signature.service';

@Injectable()
export class KrakenService {
  constructor(
    private readonly httpService: HttpService,
    private readonly signatureService: SignatureService,
  ) { }

  async futureBuy(amount:string, asset:string) {
    const nonce = Date.now();
    const postData = new URLSearchParams({
      // nonce: nonce.toString(),
      orderType: 'mkt',
      side: 'buy',
      size: '1',
      symbol: 'PF_ETHUSD',
      limitPrice: '1.0',
      stopPrice: '2.0',
    });
    const signature = this.signatureService.encryptFutureKrakenData(
      '/derivatives/api/v3/sendorder',
      postData,
      process.env.KRAKEN_FUTURE_TEMP_PRIVATE_KEY,
      nonce,
    );
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          process.env.KRAKEN_FUTURE_URL +
          'derivatives/api/v3/sendorder',
          postData,
          {
            headers: {
              Accept: 'application/json',
              APIKey: process.env.KRAKEN_FUTURE_TEMP_PUBLIC_KEY,
              Nonce: nonce.toString(),
              Authent: signature,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );
      console.log(response);
    } catch (e) {
      if (e.data) {
        console.log(e.data);
      } else {
        console.log(e);
      }
      return e;
    }
  }

  async futureSell(amount:string, asset:string) {
    const nonce = Date.now();
    const postData = new URLSearchParams({
      nonce: nonce.toString(),
      ordertype: 'mkt',
      type: 'sell',
      volume: amount,
      symbol: asset+'USD',
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
          process.env.KRAKEN_URL +
          '/private/AddOrder',
          postData,
          {
            headers: {
              'API-Key': 'JF/qGM+u1xU5gulW7ks3JrnQpiRfZ6TlW03I9ELY3v4P0sDbEqmcM0K2',
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
  
  async buy(amount: string) {
    const nonce = Date.now();
    const postData = new URLSearchParams({
      nonce: nonce.toString(),
      ordertype: 'market',
      type: 'buy',
      volume: amount,
      pair: 'ETHUSD',
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
          process.env.KRAKEN_URL +
          '0/private/AddOrder',
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
      console.log(balance);
    } catch (e) {
      // if (e.data) {
      //   console.log(e.data);
      // } else {
      //   console.log(e);
      // }
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
      pair: 'ETHUSD',
    });
    const signature = this.signatureService.encryptKrakenData(
      '/0/private/AddOrder',
      postData,
      process.env.KRAKEN_SECRET_KEY,
      nonce,
    );
    try {
      const balance = await firstValueFrom(
        this.httpService.post(
          process.env.KRAKEN_URL +
          '/private/AddOrder',
          postData,
          {
            headers: {
              'API-Key':
                process.env.KRAKEN_API_KEY,
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
    const nonce = Date.now();
    const postData = new URLSearchParams({ nonce: nonce.toString() });
    const signature = this.signatureService.encryptKrakenData(
      '/0/private/Balance',
      postData,
      process.env.KRAKEN_SECRET_KEY,
      nonce,
    );
    try {
      const balance = await firstValueFrom(
        this.httpService.post(
          process.env.KRAKEN_URL +
          '/private/Balance',
          postData,
          {
            headers: {
              'API-Key':
                process.env.KRAKEN_API_KEY,
              'API-Sign': signature,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );

      return { eth: balance.data.result.ETH, usdt: balance.data.result.ZUSD };
    } catch (e) {
      return e;
    }
  }
}
