import { Module } from '@nestjs/common';
import { MasterdataService } from './masterdata.service';
import { MasterdataController } from './masterdata.controller';
import { DatabaseModule } from 'src/common/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [MasterdataController],
  providers: [MasterdataService],
})
export class MasterdataModule {}
