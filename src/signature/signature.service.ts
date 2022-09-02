import { Injectable } from '@nestjs/common';
import { createHmac, createHash } from 'crypto';

@Injectable()
export class SignatureService {
  Base64 = require('crypto-js/enc-base64');
  HmacSHA256 = require('crypto-js/hmac-sha256');

  public ecnryptPayload(payload, key) {
    const a = new URLSearchParams({ ...payload, timestamp: Date.now() });
    console.log(a.toString());

    return createHmac('sha256', key).update(a.toString()).digest('hex');
  }
  public encryptOkexData(
    timeStamp: string,
    method: string,
    reqPath: string,
    body?,
  ): string {
    const hash = createHmac('sha256', '6331C05F1403FEE0799044A33AE4C4AE')
      .update(timeStamp + method + reqPath + (body ? JSON.stringify(body) : ''))
      .digest('base64');

    return hash;
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

  public encryptBinanceData(data: string, key) {
    return createHmac('sha256', key).update(data).digest('hex');
  }
}
