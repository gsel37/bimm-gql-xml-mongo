import { Controller, Get } from '@nestjs/common';
import { GovDataService } from './gov-data.service';

@Controller('gov-data')
export class GovDataController {
  constructor(private readonly govDataService: GovDataService) {}

  @Get('/refresh')
  async refresh(): Promise<any> {
    const result = await this.govDataService.processAllMakes();
    return result;
  }
}
