import { Injectable } from '@nestjs/common';
import { BinanceService } from './binance/binance.service';
import { CryptoService } from './crypto/crypto.service';
import { ActionInfo } from './dto/makeTrade.dto';
import { KrakenService } from './kraken/kraken.service';
import { OkexService } from './okex/okex.service';
import { log } from 'console';
import { CatchAll } from './try.decorator';
import * as colors from "colors"
colors.enable();

@CatchAll((err, ctx) => {
  log(`\n[INFO] Error in service '${ctx.constructor.name}'\n`.cyan);
  log(`[ERROR] Error message: ${err.message} \n`.red);
  log(`[ERROR] Error stack: ${err.stack}\n`.red);
})
@Injectable()
export class AppService {
  markets = {
    binance: this.binanceService,
    kraken: this.krakenService,
    crypto: this.cryptoService,
    okex: this.okexService,
  };
  constructor(
    private readonly binanceService: BinanceService,
    private readonly krakenService: KrakenService,
    private readonly cryptoService: CryptoService,
    private readonly okexService: OkexService,
  ) {
  }

  async getAllBalances() {
  }

  async makeAction({ marketHigh, marketLow, amountToBuy, asset, aproxStableValue }: ActionInfo) {
    // Buy Low and Future Lock High
    const spotBuy = await this.markets[marketLow]['buy'](amountToBuy, asset, aproxStableValue);
    const futureBuy = await this.markets[marketLow]['futureBuy'](amountToBuy, asset, aproxStableValue);
    // Get deposit network/method
    const depositMethods = await this.markets[marketHigh]['getDepositMethods'](asset);
    // Get transfer address
    const address = await this.markets[marketHigh]['getDepositAddress'](asset, depositMethods[0].method);
    // Transfer from Low to High
    const transfer = await this.markets[marketLow]['transfer'](asset, amountToBuy, address.address);
    // Sell High and Future Lock
    const spotSell = await this.markets[marketLow]['sell'](amountToBuy, asset);
    const futureSell = await this.markets[marketLow]['futureSell'](amountToBuy, asset);
  }
}
