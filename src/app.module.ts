import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CryptoService } from './crypto/crypto.service';
import { BinanceService } from './binance/binance.service';
import { KrakenService } from './kraken/kraken.service';
import { HttpModule } from '@nestjs/axios';
import { RawBodyMiddlewareMiddleware } from './middleware/raw-body.middleware';
import { RouteInfo } from '@nestjs/common/interfaces';
import { SignatureService } from './signature/signature.service';

const rawBodyParsingRoutes: Array<RouteInfo> = [
  {
    path: '*',
    method: RequestMethod.POST,
  },
];

@Module({
  imports: [HttpModule],
  controllers: [AppController],
  providers: [
    AppService,
    CryptoService,
    BinanceService,
    KrakenService,
    SignatureService,
  ],
})
export class AppModule {
  public configure(consumer: MiddlewareConsumer): MiddlewareConsumer | void {
    consumer
      .apply(RawBodyMiddlewareMiddleware)
      .forRoutes(...rawBodyParsingRoutes);
    // .apply(JsonBodyMiddleware) example of setting middleware
    // .exclude(...rawBodyParsingRoutes)
    // .forRoutes('*')
  }
}
