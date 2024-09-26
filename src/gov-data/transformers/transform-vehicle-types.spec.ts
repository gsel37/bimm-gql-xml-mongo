import { Logger } from '@nestjs/common';
import { transformVehicleTypes } from './transform-vehicle-types'; // Adjust the import path as needed

jest.mock('@nestjs/common', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    debug: jest.fn(),
    error: jest.fn(),
  })),
}));

describe('transformVehicleTypes', () => {
  let mockLoggerInstance: { debug: jest.Mock; error: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();

    mockLoggerInstance = {
      debug: jest.fn(),
      error: jest.fn(),
    };
    (Logger as unknown as jest.Mock).mockImplementation(
      () => mockLoggerInstance,
    );
  });

  it('should transform valid input correctly', () => {
    const input = {
      Response: {
        Results: [
          {
            VehicleTypesForMakeIds: [
              {
                VehicleTypeId: ['1'],
                VehicleTypeName: ['Passenger Car'],
              },
              {
                VehicleTypeId: ['2'],
                VehicleTypeName: ['Truck'],
              },
            ],
          },
        ],
        SearchCriteria: 'Make ID: 123',
      },
    };

    const result = transformVehicleTypes(input);

    expect(result).toEqual([
      { typeId: '1', typeName: 'Passenger Car' },
      { typeId: '2', typeName: 'Truck' },
    ]);
    expect(mockLoggerInstance.debug).toHaveBeenCalledWith(
      '2 types mapped for Make ID: 123',
    );
  });

  it('should return an empty array for missing or empty types', () => {
    const input = {
      Response: {
        Results: [{ VehicleTypesForMakeIds: [] }],
        SearchCriteria: 'Make ID: 456',
      },
    };

    const result = transformVehicleTypes(input);

    expect(result).toEqual([]);
    expect(mockLoggerInstance.error).toHaveBeenCalledWith(
      'Missing vehicle types for Make ID: 456: []',
    );
  });

  it('should handle undefined input gracefully', () => {
    const result = transformVehicleTypes(undefined);

    expect(result).toEqual([]);
    expect(mockLoggerInstance.error).toHaveBeenCalledWith(
      'Missing vehicle types for undefined: undefined',
    );
  });

  it('should handle malformed input', () => {
    const input = {
      Response: {
        Results: [{ VehicleTypesForMakeIds: 'not an array' }],
        SearchCriteria: 'Make ID: 789',
      },
    };

    const result = transformVehicleTypes(input);

    expect(result).toEqual([]);
    expect(mockLoggerInstance.error).toHaveBeenCalledWith(
      'Missing vehicle types for Make ID: 789: "not an array"',
    );
  });
});
