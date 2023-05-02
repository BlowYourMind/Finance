import { MarketType } from './marketType.dto';

export class ActionInfo {
  marketLow: MarketType;
  marketHigh: MarketType;
  amountToBuy: string;
  asset: string;
}
