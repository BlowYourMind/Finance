import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { log } from 'console';
import { firstValueFrom } from 'rxjs';
import { balanceInfo } from 'src/dto/balance.dto';
import { SignatureService } from 'src/signature/signature.service';


@Injectable()
export class BinanceService {
  constructor(
    private readonly httpService: HttpService,
    private readonly signatureService: SignatureService,
  ) { }
  async futureBuy(amount:string, asset:string) {
    const params = {
      symbol: asset+'USDT',
      side: 'SELL',
      positionSide: "SHORT",
      type: 'MARKET',
      quantity: amount,
      // price: '100',
      timestamp: Date.now().toString(),
    };

    const query = new URLSearchParams({
      ...params,
      signature: this.signatureService.encryptBinanceData(
        new URLSearchParams(params).toString(),
        process.env.BINANCE_FUTURE_TEMP_SECRET_KEY,
      ),
    });
    try {
      const res = await firstValueFrom(
        await this.httpService.post(
          process.env.BINANCE_FUTURE_URL +
          '/fapi/v1/order?' +
          new URLSearchParams(query).toString(),
          '',
          {
            headers: {
              'X-MBX-APIKEY':
                process.env.BINANCE_FUTURE_TEMP_PUBLIC_KEY,
            },
          },
        ),
      );
      // log(res.data);
      return res.data;
    } catch (e) {
      if (e.data) {
        // log(e.data);
      } else {
        // log(e);
      }
      return e;
    }
  }

  async futureSell(amount:string, asset:string) {
    const params = {
      symbol: asset+'USDT',
      side: 'SELL',
      positionSide: "SHORT",
      type: 'MARKET',
      quantity: amount,
      timestamp: Date.now().toString(),
    };
    const query = new URLSearchParams({
      ...params,
      signature: this.signatureService.encryptBinanceData(
        new URLSearchParams(params).toString(),
        process.env.BINANCE_TEMP_SECRET_KEY,
      ),
    });
    try {
      const res = await firstValueFrom(
        await this.httpService.post(
          process.env.BINANCE_FUTURE_URL +
          '/fapi/v1/order?' +
          new URLSearchParams(query).toString(),
          '',
          {
            headers: {
              'X-MBX-APIKEY':
                process.env.BINANCE_FUTURE_TEMP_PUBLIC_KEY,
            },
          },
        ),
      );
      // log(res.data);
      return res.data;
    } catch (e) {
      if (e.data) {
        // log(e.data);
      } else {
        // log(e);
      }
      return e;
    }
  }
  async buy(amount: string, asset:string) {
    const params = {
      symbol: asset+'USDT',
      side: 'BUY',
      type: 'MARKET',
      quantity: amount,
      timestamp: Date.now().toString(),
    };
    const query = new URLSearchParams({
      ...params,
      signature: this.signatureService.encryptBinanceData(
        new URLSearchParams(params).toString(),
        process.env.BINANCE_TEMP_SECRET_KEY,
      ),
    });
    try {
      const res = await firstValueFrom(
        await this.httpService.post(
          process.env.BINANCE_URL +
          '/v3/order?' +
          new URLSearchParams(query).toString(),
          '',
          {
            headers: {
              'X-MBX-APIKEY':
                process.env.BINANCE_TEMP_PUBLIC_KEY,
            },
          },
        ),
      );
      // log(res.data);
      return res.data;
    } catch (e) {
      if (e.data) {
        // log(e.data);
      } else {
        // log(e);
      }
      return e;
    }
  }

  async sell(amount: string, asset: string) {
    const params = {
      symbol: asset+'USDT',
      side: 'SELL',
      type: 'MARKET',
      quantity: amount,
      timestamp: Date.now().toString(),
    };
    const query = new URLSearchParams({
      ...params,
      signature: this.signatureService.encryptBinanceData(
        new URLSearchParams(params).toString(),
        process.env.BINANCE_TEMP_SECRET_KEY,
      ),
    });
    try {
      const res = await firstValueFrom(
        await this.httpService.post(
          process.env.BINANCE_URL +
          '/v3/order?' +
          new URLSearchParams(query).toString(),
          '',
          {
            headers: {
              'X-MBX-APIKEY':
                process.env.BINANCE_TEMP_PUBLIC_KEY,
            },
          },
        ),
      );
      log(res.data);
    } catch (e) {
      if (e.data) {
        log(e.data);
      } else {
        log(e);
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
        process.env.BINANCE_TEMP_SECRET_KEY,
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
        process.env.BINANCE_TEMP_SECRET_KEY,
      ),
    });
    try {
      const ethBalance = await firstValueFrom(
        this.httpService.post(
          process.env.BINANCE_SAFE_URL +
          '/v3/asset/getUserAsset?' + query1,
          {},
          {
            headers: {
              'X-MBX-APIKEY':
                process.env.BINANCE_TEMP_PUBLIC_KEY,
            },
          },
        ),
      );
      const usdtBalance = await firstValueFrom(
        this.httpService.post(
          process.env.BINANCE_SAFE_URL +
          '/v3/asset/getUserAsset?' + query2,
          {},
          {
            headers: {
              'X-MBX-APIKEY':
                process.env.BINANCE_TEMP_PUBLIC_KEY,
            },
          },
        ),
      );
      log({ eth: ethBalance.data[0].free, usdt: usdtBalance.data[0].free });
      return { eth: ethBalance.data[0].free, usdt: usdtBalance.data[0].free };
    } catch (e) {
      return e;
    }
  }
}
