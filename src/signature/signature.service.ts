import { Injectable } from '@nestjs/common';
import { createHmac, createHash } from 'crypto';

@Injectable()
export class SignatureService {
  utf8 = require('utf8');
  Base64 = require('crypto-js/enc-base64');
  HmacSHA256 = require('crypto-js/hmac-sha256');

  public ecnryptPayload(payload, key) {
    const a = new URLSearchParams({ ...payload, timestamp: Date.now() });
    console.log(a.toString());

    return createHmac('sha256', key).update(a.toString()).digest('hex');
  }
  public encryptOkexData(
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
  public encryptFutureKrakenData(
    path: string,
    request: any,
    secret: string,
    nonce: number,
  ) {
        if (path.startsWith('/derivatives')) {
      path = path.slice('/derivatives'.length)
    }
    const message = new URLSearchParams(request).toString() + nonce + path;
    const hash1 = createHash('sha256').update(this.utf8.encode(message)).digest();
    const decode = Buffer.from(secret, 'base64');
    const hash2 = createHmac('sha512', decode).update(hash1).digest();

    return Buffer.from(hash2).toString('base64'); 
  }
  public encryptKrakenData(
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

  public encryptBinanceData(data: string, key: string) {
    return createHmac('sha256', key).update(data).digest('hex');
  }
}
