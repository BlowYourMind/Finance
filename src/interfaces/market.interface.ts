export interface Market {
  buy?(): Promise<void>;
  sell?(): Promise<void>;
  futureBuy?(): Promise<void>;
  futureSell?(): Promise<void>;
  check?(): Promise<void>;
  checkFuture?(): Promise<string>;
  walletTransfer?(redisBalance: string): Promise<void>;
  futureWalletTransfer?(): Promise<void>;
  getDepositAddress?(asset:string): Promise<void>;
  getDepositMethods?(): Promise<void>;
  transfer?(highMarket: Market): Promise<void>;
  checkReceivedAsset?(): Promise<void>;
}
