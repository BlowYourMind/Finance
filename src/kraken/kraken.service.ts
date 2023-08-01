import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { log } from 'console';
import { firstValueFrom } from 'rxjs';
import { BalanceInfo } from 'src/dto/balance.dto';
import { SignatureService } from 'src/signature/signature.service';

@Injectable()
export class KrakenService {
  constructor(
    private readonly httpService: HttpService,
    private readonly signatureService: SignatureService,
  ) { }

  async getDepositMethods(asset: string) {
    const nonce = Date.now();
    const postData = new URLSearchParams({
      asset: asset,
      nonce: nonce.toString(),
    });
    log(process.env.KRAKEN_PRIVATE_KEY)
    log(process.env.KRAKEN_PUBLIC_KEY)
    const signature = this.signatureService.encryptKrakenData(
      '/0/private/DepositMethods',
      postData,
      process.env.KRAKEN_PRIVATE_KEY,
      nonce,
    );
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          process.env.KRAKEN_URL + '/private/DepositMethods',
          postData,
          {
            headers: {
              'API-Key': process.env.KRAKEN_PUBLIC_KEY,
              'API-Sign': signature,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );
      return response.data.result;
      // console.log(response.data);
    } catch (e) {
      if (e.data) {
        console.log(e.data);
      } else {
        console.log(e);
      }
    }
  }

  async getDepositAddress(asset:string, method:string, isNew: boolean = false) {
    const nonce = Date.now();
    const postData = new URLSearchParams({
      asset: asset,
      method: method,
      new: isNew ? 'true' : 'false',
      nonce: nonce.toString(),
    });
    const signature = this.signatureService.encryptKrakenData(
      '/0/private/DepositAddresses',
      postData,
      process.env.KRAKEN_PRIVATE_KEY,
      nonce,
    );
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          process.env.KRAKEN_URL + '/private/DepositAddresses',
          postData,
          {
            headers: {
              'API-Key': process.env.KRAKEN_PUBLIC_KEY,
              'API-Sign': signature,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );
      
      return response.data.result;
    } catch (e) {
      if (e.data) {
        console.log(e.data);
      } else {
        console.log(e);
      }
    }
  }

  async futureBuy(amount: string, asset: string) {
    const nonce = Date.now();
    const postData = new URLSearchParams({
      // nonce: nonce.toString(),
      orderType: 'mkt',
      side: 'buy',
      size: '1',
      symbol: 'PF_' + asset + 'USD',
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

  async futureSell(amount: string, asset: string) {
    const nonce = Date.now();
    const postData = new URLSearchParams({
      nonce: nonce.toString(),
      ordertype: 'mkt',
      type: 'sell',
      volume: amount,
      symbol: asset + 'USD',
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

  async buy(amount: string, asset: string) {
    const nonce = Date.now();
    const postData = new URLSearchParams({
      nonce: nonce.toString(),
      ordertype: 'market',
      type: 'buy',
      volume: amount,
      pair: asset + 'USDT',
    });
    const signature = this.signatureService.encryptKrakenData(
      '/0/private/AddOrder',
      postData,
      process.env.KRAKEN_PRIVATE_KEY,
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
                process.env.KRAKEN_PUBLIC_KEY,
              'API-Sign': signature,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );
      log(balance);
      return balance.data;
    } catch (e) {
      log(e)
      return e;
    }
  }

  async getOrder(txid: string) {
    const nonce = Date.now();
    const postData = new URLSearchParams({
      nonce: nonce.toString(),
      txid: txid,
    });
    const signature = this.signatureService.encryptKrakenData(
      '/0/private/QueryOrders',
      postData,
      process.env.KRAKEN_PRIVATE_KEY,
      nonce,
    );
    try {
      const balance = await firstValueFrom(
        this.httpService.post(
          process.env.KRAKEN_URL +
          '/0/private/QueryOrders',
          postData,
          {
            headers: {
              'API-Key': process.env.KRAKEN_PUBLIC_KEY,
              'API-Sign': signature,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );
      return balance.data;
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

  async check(): Promise<BalanceInfo> {
    const nonce = Date.now();
    const postData = new URLSearchParams({ nonce: nonce.toString() });
    const signature = this.signatureService.encryptKrakenData(
      '/0/private/Balance',
      postData,
      process.env.KRAKEN_PRIVATE_KEY,
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
                process.env.KRAKEN_PUBLIC_KEY,
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
