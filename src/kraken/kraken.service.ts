import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { log } from 'console';
import { firstValueFrom } from 'rxjs';
import { BalanceInfo } from 'src/dto/balance.dto';
import { SignatureService } from 'src/signature/signature.service';
import * as colors from 'colors';
import { CatchAll } from 'src/try.decorator';
import { KrakenUrls } from 'src/configs/urls';
import { KrakenWallets } from 'src/dto/kraken.dto';
import { IAdapter } from 'src/interfaces/adapter.interface';
colors.enable();

@CatchAll((err, ctx) => {
  log(`\n[INFO] Error in service '${ctx.constructor.name}'\n`.cyan);
  log(`[ERROR] Error message: ${err.message} \n`.red);
  log(`[ERROR] Error stack: ${err.stack}\n`.red);
  log(err);
})
@Injectable()
export class KrakenService implements IAdapter {
  constructor(private readonly httpService: HttpService) {}

  // add websocket to know when there is account wallet update
  async WSGetBalance() {
    const nonce = Date.now();
    const postData = new URLSearchParams({ nonce: nonce.toString() });
    const signature = await this.sign(KrakenUrls.BALANCE, postData, nonce);
    const balance = await this.waitForValue(
      KrakenUrls.BALANCE,
      postData,
      signature,
      nonce,
    );
    return balance.data.result;
  }

  async withdrawInfo(asset: string, amount: string, address: string) {
    const nonce = Date.now();
    const postData = new URLSearchParams({
      nonce: nonce.toString(),
      asset: asset,
      key:
        address === '0xe3dcb529ccf85b76e6364f8492210aa70247f223'
          ? 'okx_eth'
          : 'binance_eth',
      amount: amount,
    });
    const signature = await this.sign(
      KrakenUrls.WITHDRAW_INFO,
      postData,
      nonce,
    );
    const response = await this.waitForValue(
      KrakenUrls.WITHDRAW_INFO,
      postData,
      signature,
      nonce,
    );
    return response?.data?.result?.limit;
  }
  async transfer(asset: string, amount: string, address: string) {
    const limit = await this.withdrawInfo(asset, amount, address);
    const nonce = Date.now();
    const postData = new URLSearchParams({
      asset: asset,
      address: address,
      amount: limit,
      key:
        address === '0xe3dcb529ccf85b76e6364f8492210aa70247f223'
          ? 'okx_eth'
          : 'binance_eth',
      nonce: nonce.toString(),
    });
    const signature = await this.sign(KrakenUrls.WITHDRAW, postData, nonce);
    const response = await this.waitForValue(
      KrakenUrls.WITHDRAW,
      postData,
      signature,
      nonce,
    );
    return response.data.result;
  }

  async sign(
    method: KrakenUrls,
    postData: URLSearchParams,
    nonce: number,
    isFuture = false,
  ) {
    if (isFuture)
      return SignatureService.encryptFutureKrakenData(
        method,
        postData,
        process.env.KRAKEN_FUTURE_PRIVATE_KEY,
        nonce,
      );
    return SignatureService.encryptKrakenData(
      method,
      postData,
      process.env.KRAKEN_PRIVATE_KEY,
      nonce,
    );
  }

  async waitForValue(
    url: KrakenUrls,
    postData: URLSearchParams,
    signature: string,
    nonce: number,
    isFuture = false,
    method: 'POST' | 'GET' = 'POST',
  ) {
    const command = method === 'POST' ? 'post' : 'get';
    return await firstValueFrom(
      this.httpService[command](
        method === 'GET'
          ? (isFuture
              ? process.env.KRAKEN_FUTURE_URL + url
              : process.env.KRAKEN_URL + url) +
              '?' +
              postData
          : isFuture
          ? process.env.KRAKEN_FUTURE_URL + url
          : process.env.KRAKEN_URL + url,
        method === 'GET'
          ? {
              headers: SignatureService.createKrakenHeader(
                signature,
                nonce,
                isFuture,
              ),
            }
          : postData,
        method === 'GET'
          ? undefined
          : {
              headers: SignatureService.createKrakenHeader(
                signature,
                nonce,
                isFuture,
              ),
            },
      ),
    );
  }

  async getDepositMethods(asset: string) {
    const nonce = Date.now();
    const postData = new URLSearchParams({
      asset: asset,
      nonce: nonce.toString(),
    });
    const signature = await this.sign(
      KrakenUrls.DEPOSIT_METHODS,
      postData,
      nonce,
    );
    const response: {
      method: string;
      limit: boolean;
      'gen-address': boolean;
      minimum: string;
    }[] = (
      await this.waitForValue(
        KrakenUrls.DEPOSIT_METHODS,
        postData,
        signature,
        nonce,
      )
    ).data.result;
    return response.filter((elem) => elem.method === 'Ethereum (ERC20)');
  }

  async getDepositAddress(
    asset: string,
    method: string,
    isNew: boolean = false,
  ) {
    const nonce = Date.now();
    const postData = new URLSearchParams({
      asset: asset,
      method: method,
      new: 'false',
      nonce: nonce.toString(),
    });
    const signature = await this.sign(
      KrakenUrls.DEPOSIT_ADDRESS,
      postData,
      nonce,
    );
    try {
      const response = await this.waitForValue(
        KrakenUrls.DEPOSIT_ADDRESS,
        postData,
        signature,
        nonce,
      );
      const result: Promise<
        { method: string; limit: boolean; 'gen-address': boolean }[]
      > = response.data.result;
      if (response.data.result.length === 0)
        throw new Error('No address found');
      return result[0];
    } catch (e) {
      if (e.message === 'No address found') {
        const nonce = Date.now();
        const postData = new URLSearchParams({
          asset: asset,
          method: method,
          new: 'true',
          nonce: nonce.toString(),
        });
        const signature = await this.sign(
          KrakenUrls.DEPOSIT_ADDRESS,
          postData,
          nonce,
        );
        const response = await this.waitForValue(
          KrakenUrls.DEPOSIT_ADDRESS,
          postData,
          signature,
          nonce,
        );
        const result: Promise<
          { method: string; limit: boolean; 'gen-address': boolean }[]
        > = response.data.result;
        return result[0];
      }
    }
  }

  async walletTransfer(
    asset: string,
    amount: string,
    from: KrakenWallets,
    to: KrakenWallets,
  ) {
    const nonce = Math.floor(Date.now() * 1000);
    const postData = new URLSearchParams({
      asset: asset,
      amount: parseFloat(amount).toFixed(2),
      from: from,
      to: to,
      nonce: nonce.toString(),
    });
    const signature = await this.sign(
      KrakenUrls.WALLET_TRANSFER,
      postData,
      nonce,
    );
    const response = await this.waitForValue(
      KrakenUrls.WALLET_TRANSFER,
      postData,
      signature,
      nonce,
    );
    console.log(response);
    return response.data.result;
  }

  async futureWalletTransfer(asset: string, amount: string, from = 'cash') {
    const nonce = Date.now();
    const postData = new URLSearchParams({
      currency: asset,
      amount: amount,
      sourceWallet: from,
      nonce: nonce.toString(),
    });
    const signature = await this.sign(
      KrakenUrls.FUTURE_WALLET_TRANSFER,
      postData,
      nonce,
      true,
    );
    const response = await this.waitForValue(
      KrakenUrls.FUTURE_WALLET_TRANSFER,
      postData,
      signature,
      nonce,
      true,
    );
    return response.data.result;
  }

  async checkFuture(asset?: string): Promise<BalanceInfo> {
    const nonce = Math.floor(Date.now() * 1000);
    const postData = new URLSearchParams({
      nonce: nonce.toString(),
    });
    const signature = await this.sign(
      KrakenUrls.FUTURE_BALANCE,
      postData,
      nonce,
      true,
    );
    const response = await this.waitForValue(
      KrakenUrls.FUTURE_BALANCE,
      postData,
      signature,
      nonce,
      true,
      'GET',
    );
    return {
      [asset ? asset.toLowerCase() : 'usdt']: String(
        response.data.accounts?.flex?.currencies?.USDT?.quantity,
      ),
    };
  }

  async delay(ms: number) {
    return await new Promise((resolve) => setTimeout(resolve, ms));
  }

  async waitUntilOrderIsClosed(txid: string) {
    let order = await this.getOrder(txid);
    while (order?.result?.[txid].status !== 'closed') {
      await this.delay(1000);
      order = await this.getOrder(txid);
    }
    return order;
  }

  async waitUntilAssetIsOnWallet(
    asset: string,
    amountToExpect: string,
  ): Promise<BalanceInfo> {
    let balance = await this.check(asset);
    while (Math.abs(Number(balance[asset]) - Number(amountToExpect)) > 0.1) {
      balance = await this.check(asset);
    }
    return balance;
  }

  async futureBuy(amount: string, asset: string) {
    const nonce = Math.floor(Date.now() * 1000);
    const postData = new URLSearchParams({
      orderType: 'mkt',
      side: 'buy',
      size: amount,
      symbol: 'PF_' + asset + 'USD',
    });
    const signature = await this.sign(
      KrakenUrls.FUTURE_SEND_ORDER,
      postData,
      nonce,
      true,
    );
    const balance = await this.waitForValue(
      KrakenUrls.FUTURE_SEND_ORDER,
      postData,
      signature,
      nonce,
      true,
    );
    console.log(balance.data);
    return balance.data;
  }

  async futureSell(amount: string, asset: string) {
    const nonce = Math.floor(Date.now() * 1000);
    const postData = new URLSearchParams({
      // nonce: nonce.toString(),
      orderType: 'mkt',
      side: 'sell',
      size: amount,
      symbol: 'PF_' + asset + 'USD',
    });
    const signature = await this.sign(
      KrakenUrls.FUTURE_SEND_ORDER,
      postData,
      nonce,
      true,
    );
    const balance = await this.waitForValue(
      KrakenUrls.FUTURE_SEND_ORDER,
      postData,
      signature,
      nonce,
      true,
    );
    return balance.data;
  }

  async getOrder(txid: string) {
    const nonce = Math.floor(Date.now() * 1000);
    const postData = new URLSearchParams({
      nonce: nonce.toString(),
      txid: txid,
    });
    const signature = await this.sign(KrakenUrls.QUERY_ORDERS, postData, nonce);
    const balance = await this.waitForValue(
      KrakenUrls.QUERY_ORDERS,
      postData,
      signature,
      nonce,
    );
    return balance.data;
  }

  async buy(amount: string, asset: string) {
    const nonce = Math.floor(Date.now() * 1000);
    const postData = new URLSearchParams({
      nonce: nonce.toString(),
      ordertype: 'market',
      type: 'buy',
      volume: amount,
      pair: asset === 'USD' ? 'USDT' + asset : asset + 'USDT',
    });
    const signature = await this.sign(KrakenUrls.ADD_ORDER, postData, nonce);
    const res = await this.waitForValue(
      KrakenUrls.ADD_ORDER,
      postData,
      signature,
      nonce,
    );
    log(res.data);
    const txid = res.data.result.txid[0];
    const order = await this.waitUntilOrderIsClosed(txid);
    return { result: order?.result?.[txid], txid };
  }

  async sell(amount: string, asset: string): Promise<BalanceInfo> {
    const volume = Number(
      (await this.checkAll())['X' + asset.toUpperCase()],
    ).toFixed(5);
    log(volume);
    const nonce = Date.now();
    const postData = new URLSearchParams({
      nonce: nonce.toString(),
      ordertype: 'market',
      type: 'sell',
      volume: volume,
      pair: asset === 'USD' ? 'USDT' + asset : asset + 'USDT',
    });
    const signature = await this.sign(KrakenUrls.ADD_ORDER, postData, nonce);
    const balance = await this.waitForValue(
      KrakenUrls.ADD_ORDER,
      postData,
      signature,
      nonce,
    );
    log(balance);
    const txid = balance.data.result.txid[0];
    const order = await this.waitUntilOrderIsClosed(txid);
    return await this.waitUntilAssetIsOnWallet(
      asset,
      (order.result[txid].cost - order.result[txid].fee).toFixed(2),
    );
  }

  async checkAll(): Promise<BalanceInfo> {
    const nonce = Date.now();
    const postData = new URLSearchParams({ nonce: nonce.toString() });
    const signature = await this.sign(KrakenUrls.BALANCE, postData, nonce);
    const balance = await this.waitForValue(
      KrakenUrls.BALANCE,
      postData,
      signature,
      nonce,
    );
    return balance.data.result;
  }

  async check(asset: string): Promise<BalanceInfo> {
    const nonce = Math.floor(Date.now() * 1000);
    const postData = new URLSearchParams({ nonce: nonce.toString() });
    const signature = await this.sign(KrakenUrls.BALANCE, postData, nonce);
    const balance = await this.waitForValue(
      KrakenUrls.BALANCE,
      postData,
      signature,
      nonce,
    );
    return {
      [asset.toLowerCase()]:
        balance.data.result[asset === 'USD' ? 'ZUSD' : asset.toUpperCase()],
    };
  }
}
