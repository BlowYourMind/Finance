import { HttpService } from '@nestjs/axios';
import { Injectable, NotFoundException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { BalanceInfo } from 'src/dto/balance.dto';
import * as colors from 'colors';
import { CatchAll } from 'src/try.decorator';
import { log } from 'console';
import { IAdapter } from 'src/interfaces/adapter.interface';
import * as ccxt from 'ccxt';

colors.enable();

@CatchAll((err, ctx) => {
  log(`\n[INFO] Error in service '${ctx.constructor.name}'\n`.cyan);
  log(`[ERROR] Error message: ${err.message} \n`.red);
  log(`[ERROR] Error stack: ${err.stack}\n`.red);
})
@Injectable()
export class CryptoService implements IAdapter {
  private spotExchange: ccxt.Exchange;
  private futureExchange: ccxt.Exchange;
  constructor(private readonly httpService: HttpService) {
    const apiKey = process.env.CRYPTOCOM_API_KEY;
    const secretKey = process.env.CRYPTOCOM_SECRET_KEY;
    this.spotExchange = new ccxt.cryptocom({
      apiKey,
      secret: secretKey,
      enableRateLimit: true,
      timeout: 30000,
      options: {
        defaultType: 'spot',
        adjustForTimeDifference: true,
      },
    });

    // Initialize futures exchange
    this.futureExchange = new ccxt.cryptocom({
      apiKey,
      secret: secretKey,
      enableRateLimit: true,
      timeout: 30000,
      options: {
        defaultType: 'future',
        adjustForTimeDifference: true,
      },
    });
  }
  async futureBuy(amount: string, asset: string) {
    console.log('bought');
    return;
  }
  async buy(amount: string) {
    console.log('bought');
    return;
  }

  async sell(amount: string) {
    console.log('sold');
    return;
  }
  async check(asset: string): Promise<any> {
    try {
      const normalizedAsset = asset.toUpperCase();
      await this.spotExchange.loadMarkets();
      const balance = await this.spotExchange.fetchBalance();

      return {
        asset: normalizedAsset,
        free: balance[normalizedAsset].free || 0,
        used: balance[normalizedAsset].used || 0,
        total: balance[normalizedAsset].total || 0,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }

  async checkFuture(asset: string): Promise<any> {
    try {
      const normalizedAsset = asset.toUpperCase();
      await this.futureExchange.loadMarkets();
      const balance = await this.futureExchange.fetchBalance({
        type: 'future',
      });
      const positions =
        (await this.futureExchange.fetchPositions([
          `${normalizedAsset}/USDT`,
        ])) || [];
      const unrealizedPnL = positions.reduce((total, position) => {
        return total + (position.unrealizedPnl || 0);
      }, 0);

      return {
        asset: normalizedAsset,
        balance: {
          total: balance[normalizedAsset]?.total || 0,
          free: balance[normalizedAsset]?.free || 0,
          used: balance[normalizedAsset]?.used || 0,
        },
        positions: positions.map((position) => ({
          symbol: position.symbol,
          size: position.contracts || 0,
          notional: position.notional || 0,
          side: position.side,
          entryPrice: position.entryPrice || 0,
          unrealizedPnL: position.unrealizedPnl || 0,
          leverage: position.leverage || 1,
          liquidationPrice: position.liquidationPrice || 0,
        })),
        unrealizedPnL,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }
  async futureSell(amount: string, asset: string): Promise<any> {}
  async delay(ms: number) {
    return await new Promise((resolve) => setTimeout(resolve, ms));
  }
  async transfer(
    asset: string,
    amount: string,
    address: string,
  ): Promise<any> {}
  async getDepositAddress(asset: string): Promise<any> {}
  async getDepositMethods(asset: string): Promise<any> {}
}
