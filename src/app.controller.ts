import { Controller, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { ActionInfo } from './dto/makeTrade.dto';
import { EventPattern } from '@nestjs/microservices';
import { log } from 'console';
import { CatchAll } from './try.decorator';
import * as colors from 'colors';
colors.enable();

@CatchAll((err, ctx) => {
  log(`\n[INFO] Error in controller '${ctx.constructor.name}'\n`.cyan);
  log(`[ERROR] Error message: ${err.message} \n`.red);
  log(`[ERROR] Error stack: ${err.stack}\n`.red);
})
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {
  }

  @EventPattern('make-future-trade')
  makeFutureAction(actionFutureInfo: ActionInfo) {
    this.appService.makeAction(actionFutureInfo);
    return 'Everything Setted';
  }
}
