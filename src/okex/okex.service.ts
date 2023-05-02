import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { log } from 'console';
import { firstValueFrom } from 'rxjs';
import { balanceInfo } from 'src/dto/balance.dto';
import { SignatureService } from 'src/signature/signature.service';

@Injectable()
export class OkexService {
  ethBalance;
  usdtBalance;
  constructor(
    private readonly httpService: HttpService,
    private readonly signatureService: SignatureService,
  ) { }

  async getInstruments(asset) {
    const nonce = new Date().toISOString();
    const signature = this.signatureService.encryptOkexData(
      process.env.OKX_PRIVATE_KEY,
      nonce,
      'GET',
      '/api/v5/public/instruments',
    );
    try {
      const instruments = await firstValueFrom(
        this.httpService.get(
          process.env.OKX_URL +
          '/api/v5/public/instruments?instType=FUTURES&uly=' + asset + '-USDT',
          {
            headers: {
              'OK-ACCESS-KEY': process.env.OKX_API_KEY,
              'OK-ACCESS-SIGN': signature,
              'OK-ACCESS-PASSPHRASE': process.env.OKX_PASSPHRASE,
              'OK-ACCESS-TIMESTAMP': nonce,
            },
    
          },
        ),
      );
      return instruments.data.data.map((instrument) => {
        if(instrument.alias === 'this_week') {
          log(instrument)
          return instrument.instId;
        }
      }).filter((instrument) => instrument !== undefined)[0];
    } catch (e) {
      if (e.data) {
        console.log(e.data);
      } else {
        console.log(e);
      }
    }
  }
  

  async futureBuy(amount: string, asset: string) {
    const instId = await this.getInstruments(asset);
    // log(instId)
    const nonce = new Date().toISOString();
    const postData = {
      instId,
      tdMode: 'isolated',
      side: 'sell',
      posSide: 'short',
      ordType: 'market',
      sz: '1',
    };
    const signature = this.signatureService.encryptOkexData(
      process.env.OKX_PRIVATE_KEY,
      nonce,
      'POST',
      '/api/v5/trade/order',
      postData,
    );
    try {
      const balance = await firstValueFrom(
        this.httpService.post(
          process.env.OKX_URL +
          '/api/v5/trade/order',
          postData,
          {
            headers: {
              Content_Type: 'application/json',
              'OK-ACCESS-KEY': process.env.OKX_API_KEY,
              'OK-ACCESS-SIGN': signature,
              'OK-ACCESS-PASSPHRASE': process.env.OKX_PASSPHRASE,
              'OK-ACCESS-TIMESTAMP': nonce,
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
    }
  }

  async futureSell(amount: string, asset: string) {
    const nonce = new Date().toISOString();
    const postData = {
      instId: asset+'-USDT',
      tdMode: 'isolated',
      side: 'sell',
      posSide: 'long',
      ordType: 'market',
      sz: amount,
      tgtCcy: 'base_ccy',
    };
    const signature = this.signatureService.encryptOkexData(
      process.env.OKX_PRIVATE_KEY,
      nonce,
      'POST',
      '/api/v5/trade/order',
      postData,
    );
    try {
      const balance = await firstValueFrom(
        this.httpService.post(
          'https://www.okex.com/api/v5/trade/order',
          postData,
          {
            headers: {
              Content_Type: 'application/json',
              'OK-ACCESS-KEY': '988d9636-b941-4c1d-a3f1-81ff01140a33',
              'OK-ACCESS-SIGN': signature,
              'OK-ACCESS-PASSPHRASE': '!W#Q@E4t6r5y',
              'OK-ACCESS-TIMESTAMP': nonce,
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
    }
  }
  async buy(amount: string, asset: string) {
    const nonce = new Date().toISOString();
    const postData = {
      instId: asset + '-USDT',
      tdMode: 'cash',
      side: 'buy',
      ordType: 'market',
      sz: amount,
      tgtCcy: 'base_ccy',
    };
    const signature = this.signatureService.encryptOkexData(
      process.env.OKX_PRIVATE_KEY,
      nonce,
      'POST',
      '/api/v5/trade/order',
      postData,
    );
    try {
      const balance = await firstValueFrom(
        this.httpService.post(
          process.env.OKX_URL +
          '/api/v5/trade/order',
          postData,
          {
            headers: {
              Content_Type: 'application/json',
              'OK-ACCESS-KEY': process.env.OKX_API_KEY,
              'OK-ACCESS-SIGN': signature,
              'OK-ACCESS-PASSPHRASE': process.env.OKX_PASSPHRASE,
              'OK-ACCESS-TIMESTAMP': nonce,
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
    const nonce = new Date().toISOString();
    const postData = {
      instId: 'ETH-USDT',
      tdMode: 'cash',
      side: 'sell',
      ordType: 'market',
      sz: amount,
    };
    const signature = this.signatureService.encryptOkexData(
      process.env.OKX_PRIVATE_KEY,
      nonce,
      'POST',
      '/api/v5/trade/order',
      postData,
    );
    try {
      const balance = await firstValueFrom(
        this.httpService.post(
          'https://www.okex.com/api/v5/trade/order',
          postData,
          {
            headers: {
              Content_Type: 'application/json',
              'OK-ACCESS-KEY': '988d9636-b941-4c1d-a3f1-81ff01140a33',
              'OK-ACCESS-SIGN': signature,
              'OK-ACCESS-PASSPHRASE': '!W#Q@E4t6r5y',
              'OK-ACCESS-TIMESTAMP': nonce,
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
    const nonce = new Date().toISOString();
    const signature = this.signatureService.encryptOkexData(
      process.env.OKX_PRIVATE_KEY,
      nonce,
      'GET',
      '/api/v5/account/balance?ccy=USDT,ETH',
    );
    try {
      const balance = await firstValueFrom(
        this.httpService.get(
          'https://www.okex.com/api/v5/account/balance?ccy=USDT,ETH',
          {
            headers: {
              'Content-Type': 'application/json',
              'OK-ACCESS-KEY': '988d9636-b941-4c1d-a3f1-81ff01140a33',
              'OK-ACCESS-SIGN': signature,
              'OK-ACCESS-PASSPHRASE': '!W#Q@E4t6r5y',
              'OK-ACCESS-TIMESTAMP': nonce,
            },
          },
        ),
      );
      balance.data.data[0].details.forEach(element => {
        switch (element.ccy) {
          case 'ETH':
            this.ethBalance = element.availBal;
            break;
          case 'USDT':
            this.usdtBalance = element.availBal;
            break;
          default:
            break;
        }
      });
      return {
        eth: this.ethBalance,
        usdt: this.usdtBalance,
      };
    } catch (e) {
      console.log(e);

      return e;
    }
  }
}
