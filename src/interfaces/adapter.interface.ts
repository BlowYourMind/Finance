import { BalanceInfo } from 'src/dto/balance.dto';

export interface IAdapter {
  futureBuy(
    amount: string,
    asset: string,
    approxStableValue: string,
  ): Promise<void | any>;
  futureSell(amount: string, asset: string): Promise<void | any>;
  delay(ms: number): Promise<any>;
  buy(amount: string, asset: string, approxStableValue: string): Promise<any>;
  sell(amount: string, asset: string): Promise<void | any>;
  transfer(asset: string, amount: string, address: string): Promise<any>;
  check(asset: string): Promise<BalanceInfo>;
  getDepositAddress(
    asset: string,
    method: string,
    isNew?: boolean,
  ): Promise<any>;
  checkFuture(asset?: string): Promise<BalanceInfo> | never;
  getDepositMethods(asset: string): Promise<any>;
}
