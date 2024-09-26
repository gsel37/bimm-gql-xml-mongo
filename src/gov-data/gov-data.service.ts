import { Injectable, Logger } from '@nestjs/common';
import { xml as ALL_MAKES } from '../mocks/all-makes-data';
import { Make } from '../makes/schemas/make.schema';
import { MakesService } from '../makes/makes.service';
import { xmlParser } from './transformers/xmlParser';
import { transformMakes } from './transformers/transform-makes';
import { transformVehicleTypes } from './transformers/transform-vehicle-types';

@Injectable()
export class GovDataService {
  constructor(private readonly makesService: MakesService) {}
  private readonly logger = new Logger(GovDataService.name);
  private readonly allMakesXmlUrl =
    'https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=XML';
  private readonly vehicleTypesUrl =
    'https://vpic.nhtsa.dot.gov/api/vehicles/GetVehicleTypesForMakeId/';

  // get all makes
  async processAllMakes() {
    const now = Date.now();
    this.logger.log('All makes refresh request has started...');
    const xmlString = await this.getAllMakesXml();
    const parserToJson = await xmlParser(xmlString);
    const transformed = transformMakes(parserToJson);
    const batch = transformed.slice(50, 100);
    const withVehicleTypes = await this.addVehicleTypes(batch);
    const result = await this.saveAllMakes(withVehicleTypes);
    this.logger.log(
      `All makes refresh request is complete +${Date.now() - now}ms`,
    );
    return result;
  }

  async getAllMakesXml() {
    const now = Date.now();
    const xmlString = ALL_MAKES;
    this.logger.log(`XML response is received +${Date.now() - now}ms`);
    return xmlString;
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
    try {
      const response = await fetch(
        `${this.vehicleTypesUrl}${makeId}?format=XML`,
      );
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
