import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MakesService } from './makes.service';
import { Make } from './schemas/make.schema';

describe('MakesService', () => {
  let service: MakesService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let model: Model<Make>;

  const mockMake = {
    makeId: '123',
    makeName: 'Test Make',
    vehicleTypes: [
      { typeId: '6', typeName: 'Trailer' },
      { typeId: '10', typeName: 'Incomplete Vehicle' },
    ],
  };

  const mockModel = {
    bulkWrite: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MakesService,
        {
          provide: getModelToken(Make.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<MakesService>(MakesService);
    model = module.get<Model<Make>>(getModelToken(Make.name));
  });

  it('MakesService should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateBulk', () => {
    it('should update makes in bulk', async () => {
      const mockResult = { nModified: 1 };
      mockModel.bulkWrite.mockResolvedValue(mockResult);

      const result = await service.updateBulk([mockMake]);

      expect(mockModel.bulkWrite).toHaveBeenCalledWith([
        {
          updateOne: {
            filter: { makeId: mockMake.makeId },
            update: [
              {
                $set: {
                  makeName: mockMake.makeName,
                  makeId: mockMake.makeId,
                  vehicleTypes: mockMake.vehicleTypes,
                },
              },
            ],
            upsert: true,
          },
        },
      ]);
      expect(result).toEqual(mockResult);
    });
  });

  describe('findAll', () => {
    it('should return an array of makes', async () => {
      const mockMakes = [mockMake];
      mockModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMakes),
      });

      const result = await service.findAll();

      expect(mockModel.find).toHaveBeenCalled();
      expect(result).toEqual(mockMakes);
    });
  });

  describe('findOneByMakeId', () => {
    it('should return a make by makeId', async () => {
      mockModel.findOne.mockResolvedValue(mockMake);

      const result = await service.findOneByMakeId(mockMake.makeId);

      expect(mockModel.findOne).toHaveBeenCalledWith({
        makeId: mockMake.makeId,
      });
      expect(result).toEqual(mockMake);
    });
  });
});
