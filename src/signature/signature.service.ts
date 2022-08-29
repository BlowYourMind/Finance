import { Injectable } from '@nestjs/common';
import { createHmac, createHash } from 'crypto';

@Injectable()
export class SignatureService {
  public ecnryptPayload(payload, key) {
    const a = new URLSearchParams({ ...payload, timestamp: Date.now() });
    console.log(a.toString());

    return createHmac('sha256', key).update(a.toString()).digest('hex');
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
