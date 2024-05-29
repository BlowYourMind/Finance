import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

interface RedisBalance {
  asset: string;
  key: string;
  marketName: string;
  balanceType: string;
  value?: string | number;
}

interface RedisAction {
  key: string;
  transactionId?: string;
  value: {
    [market: string]: RedisActionData[];
  };
}

export enum ActionType {
  SPOT_BUY = 'SPOT_BUY',
  SPOT_SELL = 'SPOT_SELL',
  FUTURE_BUY = 'FUTURE_BUY',
  FUTURE_SELL = 'FUTURE_SELL',
  TRANSFER = 'TRANSFER',
}
interface RedisActionData {
  externalTransactionId: string;
  amount: number;
  assetPrice: number;
  assetName: string;
  date: Date;
  status: string;
  type: ActionType;
  transferId?: string;
}

@Injectable()
class RedisService {
  redisClient: Redis;
  constructor() {
    this.redisClient = new Redis({
      host: '38.242.203.151',
      password: 'andjf8*d@GS',
      port: 6379,
    });
  }

  async get(key: string): Promise<string> {
    return await this.redisClient.get(key);
  }
  async set(data: RedisBalance | RedisAction, expire: number): Promise<void> {
    const redisKey = this.generateRedisKey(data);
    await this.redisClient.del(redisKey);
    await this.redisClient.set(redisKey, JSON.stringify(data?.value));
    await this.redisClient.expire(redisKey, expire);
  }

  generateRedisKey(data: RedisBalance | RedisAction): string {
    if (data?.key === 'balance' && 'marketName' in data) {
      return `${data?.key}-${data?.marketName}-${
        data?.balanceType
      }-${data?.asset?.toLowerCase()}`;
    }
    if (data?.key === 'action' && 'transactionId' in data) {
      return `${data?.key}-${data?.transactionId}`;
    }
  }
}

export const redisInstance = new RedisService();
