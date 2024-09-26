import { BadRequestException, Logger } from '@nestjs/common';
import { transformMakes } from './transform-makes';

jest.mock('@nestjs/common', () => ({
  ...jest.requireActual('@nestjs/common'),
  Logger: jest.fn().mockImplementation(() => ({
    log: jest.fn(),
  })),
}));

describe('transformMakes', () => {
  let mockLoggerInstance: { log: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();

    mockLoggerInstance = {
      log: jest.fn(),
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
            AllVehicleMakes: [
              { Make_ID: ['1'], Make_Name: ['A'] },
              { Make_ID: ['2'], Make_Name: ['B'] },
            ],
          },
        ],
      },
    };

    const result = transformMakes(input);

    expect(result).toEqual([
      { makeId: '1', name: 'A' },
      { makeId: '2', name: 'B' },
    ]);

    expect(mockLoggerInstance.log).toHaveBeenCalledWith(
      '2 records mapped to Make schema',
    );
  });

  it('should throw BadRequestException for invalid input', () => {
    const invalidInput = {
      Response: {
        Results: [
          {
            AllVehicleMakes: 'Not an array',
          },
        ],
      },
    };

    expect(() => transformMakes(invalidInput)).toThrow(BadRequestException);
    expect(() => transformMakes(invalidInput)).toThrow(
      'Bad all makes list XML format',
    );
  });

  it('should throw BadRequestException for empty array input', () => {
    const emptyInput = {
      Response: {
        Results: [
          {
            AllVehicleMakes: [],
          },
        ],
      },
    };

    expect(() => transformMakes(emptyInput)).toThrow(BadRequestException);
    expect(() => transformMakes(emptyInput)).toThrow(
      'Bad all makes list XML format',
    );
  });

  it('should handle input with missing properties', () => {
    const incompleteInput = {
      Response: {
        Results: [
          {
            AllVehicleMakes: [
              { Make_ID: ['1'] }, // missing Make_Name
              { Make_Name: ['B'] }, // missing Make_ID
            ],
          },
        ],
      },
    };

    const result = transformMakes(incompleteInput);

    expect(result).toEqual([
      { makeId: '1', name: undefined },
      { makeId: undefined, name: 'B' },
    ]);

    expect(mockLoggerInstance.log).toHaveBeenCalledWith(
      '2 records mapped to Make schema',
    );
  });

  it('should handle null input by throwing BadRequestException', () => {
    expect(() => transformMakes(null)).toThrow(BadRequestException);
    expect(() => transformMakes(null)).toThrow('Bad all makes list XML format');
  });
});
