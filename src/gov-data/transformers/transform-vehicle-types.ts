import { Logger } from '@nestjs/common';

export function transformVehicleTypes(input: any): any[] {
  const logger = new Logger('transformVehicleTypes');
  const types = input?.Response?.Results[0]?.VehicleTypesForMakeIds;
  const makeId = input?.Response?.SearchCriteria;

  if (!Array.isArray(types) || !types.length) {
    logger.error(
      `Missing vehicle types for ${makeId}: ${JSON.stringify(types)}`,
    );
    return [];
  }

  const mapped = types?.map((m) => ({
    typeId: m.VehicleTypeId[0],
    typeName: m.VehicleTypeName[0],
  }));

  logger.debug(`${mapped.length} types mapped for ${makeId}`);

  return mapped;
}
