import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

interface RedisSetData {
  asset: string;
  key: string;
  marketName: string;
  balanceType: string;
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
  async set(data: RedisSetData, expire: number): Promise<void> {
    const redisKey = `${data.key}-${data.marketName}-${data.balanceType}-${data.asset}`;
    await this.update(redisKey);
    await this.redisClient.set(redisKey, data.asset);
    await this.redisClient.expire(redisKey, expire);
  }
  async update(key: string): Promise<void> {
    if (await this.get(key)) {
      await this.redisClient.del(key);
    }
  }
}

export const redisInstance = new RedisService();
