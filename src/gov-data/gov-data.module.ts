import { Module } from '@nestjs/common';
import { GovDataService } from './gov-data.service';
import { GovDataController } from './gov-data.controller';
import { MakesModule } from 'src/makes/makes.module';
import { BullModule } from '@nestjs/bull';
import { MakesBatchProcessor } from './queues/makes-batch.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'makes-batch',
    }),
    MakesModule,
  ],
  providers: [GovDataService, MakesBatchProcessor],
  controllers: [GovDataController],
})
export class GovDataModule {}
