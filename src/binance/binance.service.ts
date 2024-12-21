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
import * as ccxt from 'ccxt';

colors.enable();
@Injectable()
export class BinanceService implements IAdapter {
  private exchange: ccxt.binance;

  constructor(private readonly httpService: HttpService) {
    const apiKey = process.env.BINANCE_PUBLIC_KEY;
    const secretKey = process.env.BINANCE_SECRET_KEY;
    this.exchange = new ccxt.binance({
      apiKey: apiKey,
      secret: secretKey,
    });
  }

  async check(asset: string = 'USDT'): Promise<BalanceInfo> {
    try {
      const formattedAsset = asset.toUpperCase();
      const response = await this.exchange.fetchBalance();
      return { [formattedAsset.toLowerCase()]: response.free[formattedAsset] };
    } catch (error) {
      throw new Error(error);
    }
  }

  async checkFuture(asset: string = 'BNFCR'): Promise<BalanceInfo> {
    const res = (
      await this.makeRequest(
        BinanceUrls.FUTURE_BALANCE,
        await this.makeQuery({}),
        'GET',
        true,
      )
    )?.data.filter((item: any) => item.asset === 'BNFCR'); // asset changed to BNFCR
    return { ['bnfcr']: res[0] ? res[0].availableBalance : 0 }; // asset.toLowerCase() changed to 'bnfcr'
  }

  async buy(amount: string, asset: string): Promise<any> {
    try {
      const response = await this.exchange.createOrder(
        asset + '/USDT',
        'market',
        'buy',
        Number(amount),
      );
      return response;
    } catch (error) {
      throw new Error(error);
    }
  }

  async sell(amount: string, asset: string): Promise<any> {
    try {
      const response = await this.exchange.createOrder(
        asset + '/USDT',
        'market',
        'sell',
        Number(amount),
      );
      return response;
    } catch (error) {
      throw new Error(error);
    }
  }

  async transfer(asset: string, address: string, network: string) {
    try {
      const amountToTransfer = Object.values(await this.check(asset))[0];
      const response = await this.exchange.withdraw(
        asset,
        Number(amountToTransfer),
        address,
        {
          network: network,
        },
      );
      return response;
    } catch (e) {
      throw e;
    }
  }

  async getNetworks(asset: string, isWithdraw: boolean) {
    try {
      const response = await this.exchange.fetchCurrencies();
      const networks = response[asset]?.networks || {};
      const sortedNetworks = Object.entries(networks)
        .map(([networkKey, networkInfo]: [string, any]) => ({
          network: networkInfo.network,
          enabled: isWithdraw
            ? networkInfo.info.withdrawEnable
            : networkInfo.info.depositEnable,
          withdrawFee: networkInfo.info.withdrawFee?.toString() || '0',
        }))
        .sort((a, b) => {
          return parseFloat(a.withdrawFee) - parseFloat(b.withdrawFee);
        });
      return sortedNetworks;
    } catch (error) {
      throw error;
    }
  }

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

  async getAllConfig() {
    return (
      await this.makeRequest(BinanceUrls.GET_CONFIG, await this.makeQuery())
    ).data;
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
