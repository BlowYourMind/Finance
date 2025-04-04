import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CryptoService } from './crypto/crypto.service';
import { BinanceService } from './binance/binance.service';
import { HttpModule } from '@nestjs/axios';
import { RawBodyMiddlewareMiddleware } from './middleware/raw-body.middleware';
import { RouteInfo } from '@nestjs/common/interfaces';
import { SignatureService } from './signature/signature.service';
import { OkexService } from './okex/okex.service';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { KucoinService } from './kucoin/kucoin.service';
import { PoloniexService } from './poloniex/poloniex.service';
import { GateService } from './gate/gate.service';

const rawBodyParsingRoutes: Array<RouteInfo> = [
  {
    path: '*',
    method: RequestMethod.POST,
  },
];

@Module({
  imports: [HttpModule, ConfigModule.forRoot(), ScheduleModule.forRoot()],
  controllers: [AppController],
  providers: [
    AppService,
    CryptoService,
    KucoinService,
    PoloniexService,
    GateService,
    BinanceService,
    SignatureService,
    OkexService,
  ],
})
export class AppModule {
  public configure(consumer: MiddlewareConsumer): MiddlewareConsumer | void {
    consumer
      .apply(RawBodyMiddlewareMiddleware)
      .forRoutes(...rawBodyParsingRoutes);
  }
}
