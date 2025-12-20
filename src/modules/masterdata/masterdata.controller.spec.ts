import { Test, TestingModule } from '@nestjs/testing';
import { MasterdataController } from './masterdata.controller';
import { MasterdataService } from './masterdata.service';

describe('MasterdataController', () => {
  let controller: MasterdataController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MasterdataController],
      providers: [MasterdataService],
    }).compile();

    controller = module.get<MasterdataController>(MasterdataController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
