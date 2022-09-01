import { Test, TestingModule } from '@nestjs/testing';
import { OkexService } from './okex.service';

describe('OkexService', () => {
  let service: OkexService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OkexService],
    }).compile();

    service = module.get<OkexService>(OkexService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
