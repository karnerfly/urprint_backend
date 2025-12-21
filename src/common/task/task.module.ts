import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}
