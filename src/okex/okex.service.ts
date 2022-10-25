import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { balanceInfo } from 'src/dto/balance.dto';
import { SignatureService } from 'src/signature/signature.service';

@Injectable()
export class OkexService {
  solBalance;
  usdtBalance;
  constructor(
    private readonly httpService: HttpService,
    private readonly signatureService: SignatureService,
  ) { }

  async buy(amount: string) {
    const nonce = new Date().toISOString();
    const postData = {
      instId: 'SOL-USDT',
      tdMode: 'cash',
      side: 'buy',
      ordType: 'market',
      sz: amount,
      tgtCcy: 'base_ccy',
    };
    const signature = this.signatureService.encryptOkexData(
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

  async sell(amount: string) {
    const nonce = new Date().toISOString();
    const postData = {
      instId: 'SOL-USDT',
      tdMode: 'cash',
      side: 'sell',
      ordType: 'market',
      sz: amount,
    };
    const signature = this.signatureService.encryptOkexData(
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
      nonce,
      'GET',
      '/api/v5/account/balance?ccy=USDT,SOL',
    );
    try {
      const balance = await firstValueFrom(
        this.httpService.get(
          'https://www.okex.com/api/v5/account/balance?ccy=USDT,SOL',
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
          case 'SOL':
            this.solBalance = element.availBal;
            break;
          case 'USDT':
            this.usdtBalance = element.availBal;
            break;
          default:
            break;
        }
      });
      return {
        sol: this.solBalance,
        usdt: this.usdtBalance,
      };
    } catch (e) {
      console.log(e);

      return e;
    }
  }
}
