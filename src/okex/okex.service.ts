import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { log } from 'console';
import { firstValueFrom } from 'rxjs';
import { BalanceInfo } from 'src/dto/balance.dto';
import { OkexInstrument, OkexWallets } from 'src/dto/okex.dto';
import { SignatureService } from 'src/signature/signature.service';
import * as colors from 'colors';
import { CatchAll } from 'src/try.decorator';
import { OkexUrls } from 'src/configs/urls';
import { IAdapter } from 'src/interfaces/adapter.interface';
colors.enable();

enum OkexUlys {
  SOL = 'SOL-USDT',
  ETH = 'ETH-USDT',
  XRP = 'XRP-USDT',
}

@CatchAll((err, ctx) => {
  log(`\n[INFO] Error in service '${ctx.constructor.name}'\n`.cyan);
  log(`[ERROR] Error message: ${err} \n`.red);
  log(`[ERROR] Error stack: ${err.stack}\n`.red);
  log(err);
})
@Injectable()
export class OkexService implements IAdapter {
  constructor(private readonly httpService: HttpService) {}

  async sign(
    path: string,
    postData: any,
    nonce: string,
    method: string = 'POST',
  ) {
    return SignatureService.encryptOkexData(
      process.env.OKX_PRIVATE_KEY,
      nonce,
      method,
      path,
      postData,
    );
  }

  async waitForValue(
    path: string,
    postData: any,
    signature: string,
    nonce: string,
    method: string = 'POST',
  ) {
    const command = method === 'POST' ? 'post' : 'get';
    this.httpService.get('', {
      headers: SignatureService.createOKXHeader(signature, nonce),
    });
    return await firstValueFrom(
      this.httpService[command](
        process.env.OKX_URL + path,
        method === 'POST'
          ? postData
          : { headers: SignatureService.createOKXHeader(signature, nonce) },
        method === 'POST'
          ? {
              headers: SignatureService.createOKXHeader(signature, nonce),
            }
          : undefined,
      ),
    );
  }

  async getInstrument(asset: string): Promise<OkexInstrument> {
    const nonce = new Date().toISOString();
    const path =
      OkexUrls.INSTRUMENTS +
      '?' +
      new URLSearchParams({
        instType: 'FUTURES',
        uly: OkexUlys[asset.toUpperCase()],
      }).toString();
    const signature = await this.sign(path, {}, nonce, 'GET');
    const instruments = await this.waitForValue(
      path,
      {},
      signature,
      nonce,
      'GET',
    );
    return instruments.data.data
      .map((instrument) => {
        if (instrument.alias === 'this_week') {
          return instrument;
        }
      })
      .filter((instrument) => instrument !== undefined)[0];
  }

  async getOrder(orderId: string, instId: string) {
    const nonce = new Date().toISOString();
    const path =
      OkexUrls.ORDER +
      new URLSearchParams({ ordId: orderId, instId: instId }).toString();
    const signature = await this.sign(path, {}, nonce, 'GET');
    const order = await this.waitForValue(path, {}, signature, nonce, 'GET');
    return order.data.data[0];
  }

  async getDepositMethods(asset: string) {
    return [{ method: 'OKExChain' }];
  }

  async getDepositAddress(asset: string) {
    const nonce = new Date().toISOString();
    const path =
      OkexUrls.DEPOSIT_ADDRESS +
      '?' +
      new URLSearchParams({ ccy: asset }).toString();
    const signature = await this.sign(path, undefined, nonce, 'GET');
    const address = await this.waitForValue(
      path,
      undefined,
      signature,
      nonce,
      'GET',
    );
    return { address: address.data.data[0].addr };
  }

  async getOrderSizeFromContractSize(
    lotSz: string,
    amount: string,
  ): Promise<string> {
    return Math.ceil(Number(amount) / Number(lotSz)).toString();
  }

  async futureBuy(
    amount: string,
    asset: string,
    approxStableValue: string,
  ): Promise<string> {
    log(
      `[INFO] Shorting Future on amount of ${amount} ${asset} with ${approxStableValue} USDT`
        .cyan,
    );
    await this.moveFundsFromTo(
      approxStableValue,
      'USDT',
      OkexWallets.FUNDING,
      OkexWallets.TRADING,
    );
    const nonce = new Date().toISOString();
    const postData = await this.makeFutureParams(asset, amount);
    const signature = await this.sign(OkexUrls.ORDER, postData, nonce);
    const res = (
      await this.waitForValue(OkexUrls.ORDER, postData, signature, nonce)
    ).data;
    return res.data[0].ordId;
  }

  async setLeverage(asset: string) {
    const nonce = new Date().toISOString();
    const postData = {
      instId: (await this.getInstrument(asset)).instId,
      lever: '5',
      posSide: 'short',
      mgnMode: 'isolated',
    };
    const signature = await this.sign(OkexUrls.SET_LEVERAGE, postData, nonce);
    const res = await this.waitForValue(
      OkexUrls.SET_LEVERAGE,
      postData,
      signature,
      nonce,
    );
  }

  async futureSell(amount: string, asset: string) {
    const nonce = new Date().toISOString();
    const postData = await this.makeFutureParams(asset, amount, 'buy');
    const signature = await this.sign(OkexUrls.ORDER, postData, nonce);
    const res = await this.waitForValue(
      OkexUrls.ORDER,
      postData,
      signature,
      nonce,
    );
    const balance = await this.check('usdt');
  }

  async moveFundsFromTo(
    amount: string,
    asset: string,
    from: OkexWallets,
    to: OkexWallets,
  ): Promise<boolean> {
    const nonce = new Date().toISOString();
    const postData = {
      ccy: asset,
      amt: amount,
      from,
      to,
    };
    const signature = await this.sign(OkexUrls.TRANSFER, postData, nonce);
    const balance = await this.waitForValue(
      OkexUrls.TRANSFER,
      postData,
      signature,
      nonce,
    );
    return balance ? true : false;
  }

  async getCurrency(asset: string) {
    const nonce = new Date().toISOString();
    const path =
      OkexUrls.CURRENCIES +
      '?' +
      new URLSearchParams({ ccy: asset }).toString();
    const signature = await this.sign(path, undefined, nonce, 'GET');
    const balance = await this.waitForValue(
      path,
      undefined,
      signature,
      nonce,
      'GET',
    );
    return balance.data;
  }

  async transfer(asset: string, amount: string, address: string) {
    const nonce = new Date().toISOString();
    const fee = (await this.getCurrency(asset)).data.filter(
      (elem) => elem.chain === 'ETH-ERC20',
    )[0];
    const limit = await this.check(asset);
    const postData = {
      ccy: asset,
      amt: (Number(limit[asset.toLowerCase()]) - Number(fee.minFee)).toFixed(7),
      fee: fee.minFee,
      dest: '4',
      toAddr: address,
    };
    const signature = await this.sign(OkexUrls.WITHDRAW, postData, nonce);
    const balance = await this.waitForValue(
      OkexUrls.WITHDRAW,
      postData,
      signature,
      nonce,
    );
    return balance.data;
  }

  async delay(ms: number = 1000 * 60 * 10) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  async buy(amount: string, asset: string, approxStableValue: string) {
    const nonce = new Date().toISOString();
    await this.moveFundsFromTo(
      approxStableValue,
      'USDT',
      OkexWallets.FUNDING,
      OkexWallets.TRADING,
    );
    const postData = {
      instId: asset + '-USDT',
      tdMode: 'cash',
      side: 'buy',
      ordType: 'market',
      sz: amount,
      tgtCcy: 'base_ccy',
    };
    const signature = SignatureService.encryptOkexData(
      process.env.OKX_PRIVATE_KEY,
      nonce,
      'POST',
      '/api/v5/trade/order',
      postData,
    );
    const balance = await this.waitForValue(
      OkexUrls.ORDER,
      postData,
      signature,
      nonce,
    );
    const limit = await this.checkTrading(asset);
    await this.moveFundsFromTo(
      limit[asset.toLowerCase()],
      asset,
      OkexWallets.TRADING,
      OkexWallets.FUNDING,
    );
    return balance.data.data[0];
  }

  async sell(amount: string, asset: string) {
    const nonce = new Date().toISOString();
    const postData = {
      instId: asset + '-USDT',
      tdMode: 'cash',
      side: 'sell',
      ordType: 'market',
      sz: amount,
    };
    const signature = await this.sign(OkexUrls.ORDER, postData, nonce);
    const balance = await this.waitForValue(
      OkexUrls.ORDER,
      postData,
      signature,
      nonce,
    );
  }

  async check(asset?: string): Promise<BalanceInfo> {
    const nonce = new Date().toISOString();
    const params = asset
      ? '?' + new URLSearchParams({ ccy: asset.toUpperCase() }).toString()
      : '';
    const path = OkexUrls.TRADE_BALANCE + params;
    const signature = await this.sign(path, undefined, nonce, 'GET');
    const balance = (
      await this.waitForValue(path, undefined, signature, nonce, 'GET')
    ).data.data[0];
    return {
      [asset ? asset.toLowerCase() : 'usdt']: balance
        ? balance.details[0]?.availBal
        : '0',
    };
  }
  async checkTrading(asset?: string): Promise<BalanceInfo> {
    const nonce = new Date().toISOString();
    const params = asset
      ? '?' + new URLSearchParams({ ccy: asset }).toString()
      : '';
    const path = OkexUrls.TRADE_BALANCE + params;
    const signature = await this.sign(path, undefined, nonce, 'GET');
    const balance = (
      await this.waitForValue(path, undefined, signature, nonce, 'GET')
    ).data.data[0];
    return {
      [asset ? asset.toLowerCase() : 'usdt']: balance.details[0]
        ? balance.details[0].availBal
        : '0',
    };
  }

  async checkFuture(asset?: string): Promise<BalanceInfo> {
    const nonce = new Date().toISOString();
    const params = asset
      ? '?' + new URLSearchParams({ ccy: asset.toUpperCase() }).toString()
      : '';
    const path = OkexUrls.TRADE_BALANCE + params;
    const signature = await this.sign(path, undefined, nonce, 'GET');
    const balance = (
      await this.waitForValue(path, undefined, signature, nonce, 'GET')
    ).data.data[0];
    // availEq | String | Available equity of currency, The balance that can be used on margin or futures/swap trading, Applicable to Single-currency margin/Multi-currency margin/Portfolio margin
    // https://www.okx.com/docs-v5/en/#trading-account-rest-api-get-balance
    return {
      [asset ? asset.toLowerCase() : 'usdt']: balance.details[0]?.availEq
        ? balance.details[0]?.availEq
        : '0',
    };
  }

  async makeFutureParams(
    instId: string,
    quantity: string,
    side: 'sell' | 'buy' = 'buy',
  ) {
    return {
      instId: (await this.getInstrument(instId)).instId,
      tdMode: 'isolated',
      side,
      posSide: 'SHORT',
      ordType: 'market',
      sz: await this.getOrderSizeFromContractSize(
        (
          await this.getInstrument(instId)
        ).ctVal,
        quantity,
      ),
    };
  }
}
