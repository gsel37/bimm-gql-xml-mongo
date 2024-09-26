import { BadRequestException, Logger } from '@nestjs/common';

export function transformMakes(input: any): any[] {
  const logger = new Logger('transformMakes');
  const allMakes = input?.Response?.Results[0]?.AllVehicleMakes;

  if (!Array.isArray(allMakes) || !allMakes.length)
    throw new BadRequestException('Bad all makes list XML format');

  const mapped = allMakes?.map((m) => ({
    makeId: m.Make_ID?.[0],
    name: m.Make_Name?.[0],
  }));

  logger.log(`${mapped.length} records mapped to Make schema`);

  return mapped;
}
