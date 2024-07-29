import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { BalanceInfo } from 'src/dto/balance.dto';
import * as colors from 'colors';
import { CatchAll } from 'src/try.decorator';
import { log } from 'console';
import { IAdapter } from 'src/interfaces/adapter.interface';
colors.enable();

@CatchAll((err, ctx) => {
  log(`\n[INFO] Error in service '${ctx.constructor.name}'\n`.cyan);
  log(`[ERROR] Error message: ${err.message} \n`.red);
  log(`[ERROR] Error stack: ${err.stack}\n`.red);
})
@Injectable()
export class CryptoService implements IAdapter {
  constructor(private readonly httpService: HttpService) {}
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
  async check(): Promise<BalanceInfo> {
    console.log('check');
    return {
      eth: '0.00',
      usdt: '0.00000000',
    };
  }
  checkFuture(asset?: string): never {
    throw new Error('Not exist');
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
  async getDepositAddress(
    asset: string,
    isNew?: boolean,
  ): Promise<any> {}
  async getDepositMethods(asset: string): Promise<any> {}
}
