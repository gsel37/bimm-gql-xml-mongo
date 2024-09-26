import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Make } from './schemas/make.schema';

@Injectable()
export class MakesService {
  constructor(@InjectModel(Make.name) private makeModel: Model<Make>) {}
  private readonly logger = new Logger(MakesService.name);

  async updateBulk(makes: Make[]): Promise<any> {
    const result = await this.makeModel.bulkWrite(
      makes.map((make) => ({
        updateOne: {
          filter: { makeId: make.makeId },
          update: [
            {
              $set: {
                name: make.name,
                makeId: make.makeId,
                vehicleTypes: make.vehicleTypes || [],
              },
            },
          ],
          upsert: true,
        },
      })),
    );
    return result;
  }

  async findAll(): Promise<Make[]> {
    const now = Date.now();
    const makes = await this.makeModel.find().exec();
    this.logger.log(`Found ${makes.length} makes +${Date.now() - now}ms`);
    return makes;
  }

  async findOneByMakeId(makeId: string): Promise<Make> {
    const now = Date.now();
    const make = await this.makeModel.findOne({ makeId: makeId });
    this.logger.log(` Found make for MakeID: ${makeId} +${Date.now() - now}ms`);
    return make;
  }
}
