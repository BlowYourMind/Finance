import { MarketType } from './marketType.dto';
import { IsString } from 'class-validator';

export class ActionInfo {
  marketLow: MarketType;
  marketHigh: MarketType;
  @IsString()
  tradePercentage: string;
}
