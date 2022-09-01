import { Injectable } from '@nestjs/common';
import { createHmac, createHash } from 'crypto';

@Injectable()
export class SignatureService {
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
    console.log(hash);

    return hash;
    //  Base64.stringify(
    //   hmacSHA256(
    //     timeStamp + method + reqPath + (body ? JSON.stringify(body) : ''),
    //     '6331C05F1403FEE0799044A33AE4C4AE',
    //   ),
    // );
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
