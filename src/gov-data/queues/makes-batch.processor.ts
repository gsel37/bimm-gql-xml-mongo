import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { GovDataService } from '../gov-data.service';

@Processor('makes-batch')
export class MakesBatchProcessor {
  constructor(private readonly govDataService: GovDataService) {}
  private readonly logger = new Logger(MakesBatchProcessor.name);

  @Process('process-batch')
  async handleBatchProcessing(job: Job) {
    const now = Date.now();
    const { batch, batchNumber, batchSize } = job.data;
    this.logger.debug(`Started batch ${batchNumber}`);
    const withVehicleTypes = await this.govDataService.addVehicleTypes(batch);
    const result = await this.govDataService.saveAllMakes(withVehicleTypes);
    this.logger.log(
      `Batch: ${batchNumber} for makes (${(batchNumber - 1) * batchSize} - ${batchNumber * batchSize}) added: ${result.insertedCount}, updated: ${result.modifiedCount} +${Date.now() - now}ms`,
    );
  }
}
