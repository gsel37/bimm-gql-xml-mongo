import { Module } from '@nestjs/common';
import { GovDataService } from './gov-data.service';
import { GovDataController } from './gov-data.controller';
import { MakesModule } from 'src/makes/makes.module';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'makesBatch',
    }),
    MakesModule,
  ],
  providers: [GovDataService],
  controllers: [GovDataController],
})
export class GovDataModule {}
