import { Injectable, Logger } from '@nestjs/common';
// import { xml as ALL_MAKES } from '../mocks/all-makes-data';
import { Make } from '../makes/schemas/make.schema';
import { MakesService } from '../makes/makes.service';
import { xmlParser } from './transformers/xmlParser';
import { transformMakes } from './transformers/transform-makes';
import { transformVehicleTypes } from './transformers/transform-vehicle-types';
import * as constants from './gov-data.constants';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class GovDataService {
  private readonly logger = new Logger(GovDataService.name);
  private readonly makesBatchQueue: Queue;
  private readonly allMakesXmlUrl =
    constants.GOV_DATA_URL + constants.GET_ALL_MAKES;
  private readonly vehicleTypesUrl = constants.GET_VEHICLE_TYPES_FOR_MAKEID;

  constructor(
    private readonly makesService: MakesService,
    @InjectQueue('makes-batch') makesBatchQueue: Queue,
  ) {
    this.makesBatchQueue = makesBatchQueue;
  }

  async processAllMakes() {
    this.logger.log('All makes refresh request has started...');
    const xmlString = await this.getAllMakesXml();
    const parserToJson = await xmlParser(xmlString);
    const transformed = transformMakes(parserToJson);
    const result = await this.batchMakes(transformed);
    return result;
  }

  async getAllMakesXml() {
    const now = Date.now();
    try {
      const response = await fetch(this.allMakesXmlUrl);
      const xmlString = await response.text();
      this.logger.log(
        `All makes XML response is received +${Date.now() - now}ms`,
      );
      return xmlString;
    } catch (error) {
      this.logger.error('error', error);
      throw new Error(error);
    }
  }

  async batchMakes(makes: Make[]): Promise<{ message: string }> {
    const batchSize = constants.BATCH_SIZE;

    // the following 2 lines left for estimation purposes only delete when going for staging or production
    let b = 0;
    const batchCount = 1; // should take about 40 secs for process 2 batches;

    // Uncomment lines below for production, staging or updating all records in your database
    // let b = 0;
    // const batchCount = Math.ceil(makes.length / batchSize);

    this.logger.log(`This run has ${batchCount} batch(es)`);

    for (b; b < batchCount; b++) {
      const batch = makes.slice(b * batchSize, (b + 1) * batchSize);
      await this.makesBatchQueue.add('process-batch', {
        batch,
        batchNumber: b + 1,
        batchSize,
      });
    }
    const isQueueRunning = await this.checkQueueStatus();
    if (isQueueRunning) {
      this.logger.debug('Makes batch queues are running');
    } else {
      this.logger.debug('Makes batch queue is NOT running');
    }

    return { message: `Set queue for ${batchCount} batch(es)` };
  }

  async checkQueueStatus(): Promise<boolean> {
    try {
      const isPaused = await this.makesBatchQueue.isPaused();
      const jobCounts = await this.makesBatchQueue.getJobCounts();
      this.logger.debug(`${jobCounts} are running`);

      // Check if the queue has active jobs or is not paused
      const isRunning = !isPaused || jobCounts.active > 0;

      return isRunning;
    } catch (error) {
      this.logger.error('Error checking queue status:', error);
      return false;
    }
  }

  async addVehicleTypes(makes: Make[]): Promise<Make[]> {
    const now = Date.now();
    const list = [];
    for (const make of makes) {
      const xml = await this.getVehicleTypesForMake(make.makeId);
      const parsed = await xmlParser(xml);
      const types = transformVehicleTypes(parsed);
      const updated = { ...make, vehicleTypes: types };
      list.push(updated);
    }
    this.logger.debug(`Vehicle types are added +${Date.now() - now}ms`);
    return list;
  }

  async getVehicleTypesForMake(makeId: string) {
    const now = Date.now();
    const url = `${constants.GOV_DATA_URL}${constants.GET_VEHICLE_TYPES_FOR_MAKEID}/${makeId}?format=XML`;
    try {
      const response = await fetch(url);
      const xmlString = await response.text();
      this.logger.debug(
        `Make ID:${makeId} Vehicle types are received +${Date.now() - now}ms`,
      );
      return xmlString;
    } catch (error) {
      this.logger.error('error', error);
      throw new Error(error);
    }
  }

  async saveAllMakes(makes: Make[]): Promise<any> {
    const now = Date.now();
    this.logger.debug('Saving to DB has started...');
    const saved = await this.makesService.updateBulk(makes);
    this.logger.debug(`Saved to DB +${Date.now() - now}ms`);
    return saved;
  }
}
