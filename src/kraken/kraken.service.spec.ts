import { Test, TestingModule } from '@nestjs/testing';
import { KrakenService } from './kraken.service';

describe('KrakenService', () => {
  let service: KrakenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KrakenService],
    }).compile();

    service = module.get<KrakenService>(KrakenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
