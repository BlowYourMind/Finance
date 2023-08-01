import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { log } from 'console';
import { firstValueFrom } from 'rxjs';
import { BalanceInfo } from 'src/dto/balance.dto';
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
        process.env.BINANCE_SECRET_KEY,
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
                process.env.BINANCE_PUBLIC_KEY,
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
        process.env.BINANCE_SECRET_KEY,
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
        process.env.BINANCE_SECRET_KEY,
      ),
    });
    try {
      const res = await firstValueFrom(
        await this.httpService.post(
          process.env.BINANCE_URL +
          '/api/v3/order?' +
          new URLSearchParams(query).toString(),
          '',
          {
            headers: {
              'X-MBX-APIKEY':
                process.env.BINANCE_PUBLIC_KEY,
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

  async moveAssetsToFuture(amount: string, asset: string) {
    const params = {
      asset: asset,
      amount: amount,
      type: '1',
      timestamp: Date.now().toString(),
    };
    const query = new URLSearchParams(
      {
        ...params,
        signature: this.signatureService.encryptBinanceData(
          new URLSearchParams(params).toString(),
          process.env.BINANCE_SECRET_KEY,
        ), 
      }
    );
    try {
      const res = await firstValueFrom(
        await this.httpService.post(
          process.env.BINANCE_URL +
          '/sapi/v1/asset/transfer?' +
          new URLSearchParams(query).toString(),
          '',
          {
            headers: {
              'X-MBX-APIKEY':
                process.env.BINANCE_PUBLIC_KEY,
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

  async getCapitalConfig(asset: string) {
    const params = {
      timestamp: Date.now().toString(),
    };
    const query = new URLSearchParams(
      {
        ...params,
        signature: this.signatureService.encryptBinanceData(
          new URLSearchParams(params).toString(),
          process.env.BINANCE_SECRET_KEY,
        ),
      }
    );
    try {
      const res = await firstValueFrom(
        await this.httpService.get(
          process.env.BINANCE_URL +
          '/sapi/v1/capital/config/getall?' +
          new URLSearchParams(query).toString(),
          {
            headers: {
              'X-MBX-APIKEY':
                process.env.BINANCE_PUBLIC_KEY,
            },
          },
        ),
      );
      // log(res.data);
      return res.data.filter((item: any) => item.coin === asset)[0].networkList;
    } catch (e) {
      if (e.data) {
        log(e.data);
      } else {
        log(e);
      }
      return e;
    }
  }


  async makeWithdrawal(amount: string, asset: string, address: string) {
    const params = {
      coin: asset,
      withdrawOrderId: Date.now().toString(),
      network: 'ETH',
      address: address,
      amount: amount,
      timestamp: Date.now().toString(),
    };
    const query = new URLSearchParams({
      ...params,
      signature: this.signatureService.encryptBinanceData(
        new URLSearchParams(params).toString(),
        process.env.BINANCE_SECRET_KEY,
      ),
    });
    try {
      const res = await firstValueFrom(
        await this.httpService.post(
          process.env.BINANCE_URL +
          '/sapi/v1/capital/withdraw/apply?' +
          new URLSearchParams(query).toString(),
          '',
          {
            headers: {
              'X-MBX-APIKEY':
                process.env.BINANCE_PUBLIC_KEY,
            },
          },
        ),
      );
      log(res.data);
      return res.data;
    } catch (e) {
      if (e.data) {
        log(e.data);
      } else {
        log(e);
      }
      return e;
    }
  }

  async getDepositAddress(asset: string) {
    const params = {
      coin: asset,
      timestamp: Date.now().toString(),
    };
    const query = new URLSearchParams({
      ...params,
      signature: this.signatureService.encryptBinanceData(
        new URLSearchParams(params).toString(),
        process.env.BINANCE_SECRET_KEY,
      ),
    });
    try {
      const res = await firstValueFrom(
        await this.httpService.get(
          process.env.BINANCE_URL +
          '/sapi/v1/capital/deposit/address?' +
          new URLSearchParams(query).toString(),
          {
            headers: {
              'X-MBX-APIKEY':
                process.env.BINANCE_PUBLIC_KEY,
            },
          },
        ),
      );
      log(res.data);
      return res.data;
    } catch (e) {
      if (e.data) {
        log(e.data);
      } else {
        log(e);
      }
      return e;
    }
  }

  async check(asset: string ): Promise<BalanceInfo> {
    const params1 = {
      asset,
      timestamp: Date.now().toString(),
    };
    const query1 = new URLSearchParams({
      ...params1,
      signature: this.signatureService.encryptBinanceData(
        new URLSearchParams(params1).toString(),
        process.env.BINANCE_SECRET_KEY,
      ),
    });
    try {
      const res = await firstValueFrom(
        this.httpService.post(
          process.env.BINANCE_URL +
          '/sapi/v3/asset/getUserAsset?' + query1,
          {},
          {
            headers: {
              'X-MBX-APIKEY':
                process.env.BINANCE_PUBLIC_KEY,
            },
          },
        ),
      );
      log({ [asset.toLowerCase()]: res.data[0].free });
      return { [asset.toLowerCase()]: res.data[0].free };
    } catch (e) {
      return e;
    }
  }
}
