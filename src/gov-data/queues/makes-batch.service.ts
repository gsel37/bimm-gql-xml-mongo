import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Make } from 'src/makes/schemas/make.schema';

@Injectable()
export class MakesBatchService {
  constructor(@InjectQueue('makes-batch') private queue: Queue) {}

  async processBatch(makes: Make[]) {
    await this.queue.add('batch-processing', {
      batch: makes,
      batchNumber: 1,
      batchSize: 50,
    });
  }

  async checkQueueStatus(): Promise<boolean> {
    try {
      const isPaused = await this.queue.isPaused();
      const jobCounts = await this.queue.getJobCounts();

      const isRunning = !isPaused || jobCounts.active > 0;

      return isRunning;
    } catch (error) {
      console.error('Error checking "makes-batch" queue status:', error);
      return false;
    }
  }
}
