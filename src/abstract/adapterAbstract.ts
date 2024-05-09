import { BalanceInfo } from 'src/dto/balance.dto';

export abstract class AdapterAbstract {
  abstract futureBuy(
    amount: string,
    asset: string,
    approxStableValue: string,
  ): Promise<void | any>;
  abstract futureSell(amount: string, asset: string): Promise<void | any>;
  abstract delay(ms: number): Promise<any>;
  abstract buy(
    amount: string,
    asset: string,
    approxStableValue: string,
  ): Promise<any>;
  abstract sell(amount: string, asset: string): Promise<void | any>;
  abstract transfer(
    asset: string,
    amount: string,
    address: string,
  ): Promise<any>;
  abstract check(asset: string): Promise<BalanceInfo>;
  abstract getDepositAddress(
    asset: string,
    method: string,
    isNew: boolean,
  ): Promise<any>;
  abstract getDepositMethods(asset: string): Promise<any>;
}
