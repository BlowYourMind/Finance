import { Injectable } from '@nestjs/common';
import { createHmac, createHash } from 'crypto';
import * as colors from "colors"
import { log } from 'console';
import { CatchAll } from 'src/try.decorator';
colors.enable();

@CatchAll((err, ctx) => {
  log(`\n[INFO] Error in service '${ctx.constructor.name}'\n`.cyan);
  log(`[ERROR] Error message: ${err.message} \n`.red);
  log(`[ERROR] Error stack: ${err.stack}\n`.red);
})
@Injectable()
export class SignatureService {
  public static ecnryptPayload(payload, key) {
    const a = new URLSearchParams({ ...payload, timestamp: Date.now() });
    return createHmac('sha256', key).update(a.toString()).digest('hex');
  }
  public static encryptOkexData(
    secret: string,
    timeStamp: string,
    method: string,
    reqPath: string,
    body?,
  ): string {
    const hash = createHmac('sha256', secret)
      .update(timeStamp + method + reqPath + (body ? JSON.stringify(body) : ''))
      .digest('base64');

    return hash;
  }
  public static encryptFutureKrakenData(
    path: string,
    request: any,
    secret: string,
    nonce: number,
  ) {
    if (path.startsWith('/derivatives')) {
      path = path.slice('/derivatives'.length)
    }
    const utf8 = require('utf8');
    const message = new URLSearchParams(request).toString() + nonce + path;
    const hash1 = createHash('sha256').update(utf8.encode(message)).digest();
    const decode = Buffer.from(secret, 'base64');
    const hash2 = createHmac('sha512', decode).update(hash1).digest();

    return Buffer.from(hash2).toString('base64');
  }
  public static encryptKrakenData(
    path: string,
    request: any,
    secret: string,
    nonce: number,
  ) {
    return createHmac('sha512', Buffer.from(secret, 'base64'))
      .update(path)
      .update(
        createHash('sha256')
          .update(nonce + request)
          .digest(),
      )
      .digest('base64');
  }

  public encryptBinanceWSData(data: string, key: string) {

  }

  public static encryptBinanceData(data: string, key: string) {
    return createHmac('sha256', key).update(data).digest('hex');
  }

  public static createOKXHeader(signature: string, nonce: string) {
    return {
      'Content-Type': 'application/json',
      'OK-ACCESS-KEY': process.env.OKX_API_KEY,
      'OK-ACCESS-SIGN': signature,
      'OK-ACCESS-TIMESTAMP': nonce,
      'OK-ACCESS-PASSPHRASE': process.env.OKX_PASSPHRASE,
    };
  }
  public static createBinanceHeader() {
    return {
      'X-MBX-APIKEY': process.env.BINANCE_PUBLIC_KEY,
    };
  }
  public static createKrakenHeader(signature: string, nonce: number, isFuture: boolean = false) {
    if (isFuture) {
      return {
        Accept: 'application/json',
        APIKey: process.env.KRAKEN_FUTURE_PUBLIC_KEY,
        Nonce: nonce.toString(),
        Authent: signature,
      }
    }
    return {
      Accept: 'application/json',
      'API-Key': process.env.KRAKEN_PUBLIC_KEY,
      Nonce: nonce.toString(),
      'API-Sign': signature,
      'Content-Type': 'application/x-www-form-urlencoded',
    };
  }

}
