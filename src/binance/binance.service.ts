import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { log } from 'console';
import { firstValueFrom } from 'rxjs';
import { BalanceInfo } from 'src/dto/balance.dto';
import { SignatureService } from 'src/signature/signature.service';
import * as colors from 'colors';
import { BinanceUrls } from 'src/configs/urls';
import { BinanceFutureActionParams } from 'src/dto/binance.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IAdapter } from 'src/interfaces/adapter.interface';
import { ActionType } from 'src/redis/redis.service';

colors.enable();
@Injectable()
export class BinanceService implements IAdapter {
  constructor(private readonly httpService: HttpService) {}

  @Cron(CronExpression.EVERY_SECOND)
  async test() {}

  async futureBuy(amount: string, asset: string, redisFutureBalance: string) {
    const res = (
      await this.makeRequest(
        BinanceUrls.FUTURE_ORDER,
        await this.makeQuery(
          await this.makeFutureParams(asset, amount, 'SELL'),
        ),
        'POST',
        true,
      )
    ).data;
    return {
      externalTransactionId: res.orderId,
      market: 'binance',
      amountToBuy: res.origQty,
      price: res.price,
      asset: res.symbol,
      status: res.status,
      type: ActionType.FUTURE_BUY,
      balanceType: 'futures',
      value: redisFutureBalance,
    };
  }

  async buy(amount: string, asset: string) {
    const query = await this.makeQuery({
      symbol: asset + 'USDT',
      side: 'BUY',
      type: 'MARKET',
      quoteOrderQty: amount,
    });
    return (await this.makeRequest(BinanceUrls.ORDER, query))?.data;
  }

  async delay(ms: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  async futureSell(asset: string, redisFutureBalance: string) {
    let quantity = await this.makeRequest(
      BinanceUrls.FUTURE_POSITION,
      await this.makeQuery({ symbol: 'ETHUSDT' }),
      'GET',
      true,
    );
    quantity = Number(quantity.data[1].positionAmt) * -1;
    const res = (
      await this.makeRequest(
        BinanceUrls.FUTURE_ORDER,
        await this.makeQuery(
          await this.makeFutureParams(asset, quantity, 'BUY'),
        ),
        'POST',
        true,
      )
    ).data;
    return {
      externalTransactionId: res.orderId,
      market: 'binance',
      amountToBuy: res.origQty,
      price: res.price,
      asset: res.symbol,
      status: res.status,
      type: ActionType.FUTURE_SELL,
      balanceType: 'futures',
      value: redisFutureBalance,
    };
  }

  async sell(asset: string, redisBalance: string) {
    const limit = await this.getCapitalConfig(asset);
    const query = await this.makeQuery({
      symbol: asset + 'USDT',
      side: 'SELL',
      type: 'MARKET',
      quantity: Number(limit.free).toFixed(3),
    });
    const res = (await this.makeRequest(BinanceUrls.ORDER, query)).data;
    return {
      externalTransactionId: res.orderId,
      market: 'binance',
      amountToBuy: res.origQty,
      price: res.fills[0].price,
      asset: res.symbol,
      status: res.status,
      type: ActionType.SPOT_SELL,
      balanceType: 'spot',
      value: Number(redisBalance) + Number(res?.cummulativeQuoteQty),
    };
  }

  // TODO: add market type
  async transfer(asset: string, address: string, amount?: string) {
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

  async checkFuture(asset: string = 'BNFCR'): Promise<BalanceInfo> {
    const res = (
      await this.makeRequest(
        BinanceUrls.FUTURE_BALANCE,
        await this.makeQuery({}),
        'GET',
        true,
      )
    ).data.filter((item: any) => item.asset === 'BNFCR'); // asset changed to BNFCR
    return { ['bnfcr']: res[0] ? res[0].availableBalance : 0 }; // asset.toLowerCase() changed to 'bnfcr'
  }

  async getCapitalConfig(asset: string) {
    const res = await this.makeRequest(
      BinanceUrls.CAPITAL_CONFIG,
      await this.makeQuery(),
      'GET',
    );
    return res.data.filter((item: any) => item.coin === asset)[0];
  }

  async getDepositAddress(asset: string) {
    return (
      await this.makeRequest(
        BinanceUrls.DEPOSIT_ADDRESS,
        await this.makeQuery({ coin: asset }),
        'GET',
      )
    ).data.address;
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
    const baseUrl = isFuture
      ? process.env.BINANCE_FUTURE_URL
      : process.env.BINANCE_URL;
    const url = `${baseUrl}${path}?${params}`;
    const headers = { headers: SignatureService.createBinanceHeader() };
    try {
      const res = await firstValueFrom(
        method === 'POST'
          ? this.httpService.post(url, null, headers)
          : this.httpService.get(url, headers),
      );
      return res;
    } catch (e) {
      log(e);
    }
  }
}
