import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { log } from 'console';
import { firstValueFrom } from 'rxjs';
import { BalanceInfo } from 'src/dto/balance.dto';
import { SignatureService } from 'src/signature/signature.service';
import * as colors from 'colors';
import { BinanceUrls } from 'src/configs/urls';
import {
  BinanceTransferTypes,
  BinanceMoveParameters,
  BinanceFutureActionParams,
} from 'src/dto/binance.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import Redis from 'ioredis';
import { IAdapter } from 'src/interfaces/adapter.interface';

colors.enable();
@Injectable()
export class BinanceService implements IAdapter {
  client: Redis;
  constructor(private readonly httpService: HttpService) {
    this.client = new Redis({
      host: '38.242.203.151',
      password: 'andjf8*d@GS',
      port: 6379,
    });
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async updateBlanace() {
    await this.client.set(
      'balance-binance',
      JSON.stringify(await this.check()),
      'EX',
      10,
    );
  }

  @Cron(CronExpression.EVERY_SECOND)
  async test() {
    // console.log(await this.client.get('balance-binance'));
    // console.log(await this.client.get('balance-binance-future-usdt'));
    // console.log(await this.client.get('balance-binance-spot-usdt'));
  }

  async initialiseRedisBalance(
    value: string,
    type: string = 'spot',
  ): Promise<void> {
    const redisKey = `balance-binance-${type}-${
      Object.keys(JSON.parse(value))[0]
    }`;

    await this.client.set(redisKey, value);
    await this.client.expire(redisKey, 300);
  }

  async futureBuy(amount: string, asset: string, approxStableValue: string) {
    await this.moveAssetsTo({
      amount: approxStableValue,
      asset: 'USDT',
      type: BinanceTransferTypes.MAIN_UMFUTURE,
    });
    const res = await this.makeRequest(
      BinanceUrls.FUTURE_ORDER,
      await this.makeQuery(await this.makeFutureParams(asset, amount, 'SELL')),
      'POST',
      true,
    );
    await this.moveAssetsTo({
      amount: (await this.checkFuture())['usdt'],
      asset: 'USDT',
      type: BinanceTransferTypes.UMFUTURE_MAIN,
    });
    return res.data;
  }

  async buy(amount: string, asset: string) {
    const query = await this.makeQuery({
      symbol: asset + 'USDT',
      side: 'BUY',
      type: 'MARKET',
      quantity: amount,
    });
    return (await this.makeRequest(BinanceUrls.ORDER, query)).data;
  }

  async delay(ms: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  async futureSell(amount: string, asset: string) {
    const res = await this.makeRequest(
      BinanceUrls.FUTURE_ORDER,
      await this.makeQuery(await this.makeFutureParams(asset, amount)),
      'POST',
      true,
    );
    await this.moveAssetsTo({
      amount: (await this.checkFuture())['usdt'],
      asset: 'USDT',
      type: BinanceTransferTypes.UMFUTURE_MAIN,
    });
    return res.data;
  }

  async sell(amount: string, asset: string) {
    const limit = await this.getCapitalConfig(asset);
    const query = await this.makeQuery({
      symbol: asset + 'USDT',
      side: 'SELL',
      type: 'MARKET',
      quantity: limit.free,
    });
    return (await this.makeRequest(BinanceUrls.ORDER, query)).data;
  }

  // TODO: add market type
  async transfer(asset: string, amount: string, address: string) {
    const limit = await this.getCapitalConfig(asset);
    const query = await this.makeQuery({
      coin: asset,
      amount: limit.free,
      address,
    });
    const res = await this.makeRequest(BinanceUrls.WITHDRAW, query);
    return res.data;
  }

  async getAllConfig() {
    return (
      await this.makeRequest(BinanceUrls.GET_CONFIG, await this.makeQuery())
    ).data;
  }

  async check(asset: string = 'USDT'): Promise<BalanceInfo> {
    const res = await this.makeRequest(
      BinanceUrls.GET_ASSET,
      await this.makeQuery({ asset }),
      'POST',
    );
    return { [asset.toLowerCase()]: res?.data[0] ? res?.data[0]?.free : 0 };
  }

  async checkAll(): Promise<BalanceInfo> {
    const res = await this.makeRequest(
      BinanceUrls.GET_BALANCE,
      await this.makeQuery({}),
      'GET',
    );
    return res.data.balances
      .map((item: any) => ({ [item.asset.toLowerCase()]: item.free }))
      .reduce((acc, item) => ({ ...acc, ...item }), {});
  }

  async checkFuture(asset: string = 'USDT'): Promise<BalanceInfo> {
    const res = (
      await this.makeRequest(
        BinanceUrls.FUTURE_BALANCE,
        await this.makeQuery({}),
        'GET',
        true,
      )
    ).data.filter((item: any) => item.asset === asset);
    return { [asset.toLowerCase()]: res[0] ? res[0].availableBalance : 0 };
  }

  async moveAssetsTo(params: BinanceMoveParameters) {
    return (
      await this.makeRequest(BinanceUrls.TRANSFER, await this.makeQuery(params))
    ).data;
  }

  async getCapitalConfig(asset: string) {
    const res = await this.makeRequest(
      BinanceUrls.CAPITAL_CONFIG,
      await this.makeQuery(),
      'GET',
    );
    return res.data.filter((item: any) => item.coin === asset)[0];
  }

  async getDepositAddress(asset: string, method: string = 'BEP2') {
    return (
      await this.makeRequest(
        BinanceUrls.DEPOSIT_ADDRESS,
        await this.makeQuery({ coin: asset }),
        'GET',
      )
    ).data;
  }

  async getDepositMethods(asset: string) {
    // TODO: add method
    return [{ method: 'TEST' }];
  }

  async makeFutureParams(
    asset: string,
    quantity: string,
    side: 'SELL' | 'BUY' = 'BUY',
  ): Promise<BinanceFutureActionParams> {
    return {
      symbol: asset + 'USDT',
      side,
      positionSide: 'SHORT',
      type: 'MARKET',
      quantity,
    };
  }

  async makeQuery(params?: any): Promise<string> {
    const DTO = {
      ...params,
      timestamp: Date.now().toString(),
    };
    return new URLSearchParams({
      ...DTO,
      signature: SignatureService.encryptBinanceData(
        new URLSearchParams(DTO).toString(),
        process.env.BINANCE_SECRET_KEY,
      ),
    }).toString();
  }

  async makeRequest(
    path: string,
    params: string,
    method: 'POST' | 'GET' = 'POST',
    isFuture: boolean = false,
  ): Promise<any> {
    const command = method.toLowerCase();
    const url = isFuture
      ? process.env.BINANCE_FUTURE_URL
      : process.env.BINANCE_URL;
    try {
      const res = isFuture
        ? await firstValueFrom(
            this.httpService[command](url + path + '?' + params, {
              headers: SignatureService.createBinanceHeader(),
            }),
          )
        : await firstValueFrom(
            this.httpService[command](url + path + '?' + params, null, {
              headers: SignatureService.createBinanceHeader(),
            }),
          );
      return res;
    } catch (e) {
      log(e);
    }
  }
}
