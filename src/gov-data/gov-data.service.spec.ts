import { Test, TestingModule } from '@nestjs/testing';
import { GovDataService } from './gov-data.service';
import { MakesService } from '../makes/makes.service';
// import { Queue } from 'bull';
// import { xml as ALL_MAKES } from '../mocks/all-makes-data';
import * as xmlParser from './transformers/xmlParser';
import * as mapMakes from './transformers/transform-makes';
import * as mapVehicleTypes from './transformers/transform-vehicle-types';
import { getQueueToken } from '@nestjs/bull';

// Create a mock class for MakesService
class MockMakesService {
  updateBulk = jest.fn();
}

jest.mock('../mocks/all-makes-data', () => ({
  xml: '<mockXml>...</mockXml>',
}));

describe('GovDataService', () => {
  let service: GovDataService;
  let makesService: MakesService;
  let mockQueue: any;

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn().mockResolvedValue(undefined),
      isPaused: jest.fn().mockResolvedValue(false),
      getJobCounts: jest.fn().mockResolvedValue({ active: 0 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GovDataService,
        {
          provide: MakesService,
          useClass: MockMakesService,
        },
        {
          provide: getQueueToken('makes-batch'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<GovDataService>(GovDataService);
    makesService = module.get<MakesService>(MakesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processAllMakes', () => {
    it('should process all makes successfully', async () => {
      const mockXmlParserResult = {
        Result: [{ Make_ID: '1', Make_Name: 'Test' }],
      };
      const mockTransformedMakes = [{ makeId: '1', makeName: 'Test' }];

      jest
        .spyOn(service, 'getAllMakesXml')
        .mockResolvedValue('<mockXml>...</mockXml>');
      jest.spyOn(xmlParser, 'xmlParser').mockResolvedValue(mockXmlParserResult);
      jest
        .spyOn(mapMakes, 'transformMakes')
        .mockReturnValue(mockTransformedMakes);
      jest
        .spyOn(service, 'batchMakes')
        .mockResolvedValue({ message: 'Set queue for 1 batch(es)' });

      const result = await service.processAllMakes();

      expect(service.getAllMakesXml).toHaveBeenCalled();
      expect(xmlParser.xmlParser).toHaveBeenCalledWith(
        '<mockXml>...</mockXml>',
      );
      expect(mapMakes.transformMakes).toHaveBeenCalledWith(mockXmlParserResult);
      expect(service.batchMakes).toHaveBeenCalledWith(mockTransformedMakes);
      expect(result).toEqual({ message: 'Set queue for 1 batch(es)' });
    });
  });

  describe('batchMakes', () => {
    it('should batch makes and add them to the queue', async () => {
      const mockMakes = [{ makeId: '1', makeName: 'Test', vehicleTypes: [] }];
      jest.spyOn(service, 'checkQueueStatus').mockResolvedValue(true);

      const result = await service.batchMakes(mockMakes);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'process-batch',
        expect.objectContaining({
          batch: expect.any(Array),
          batchNumber: expect.any(Number),
          batchSize: expect.any(Number),
        }),
      );
      expect(service.checkQueueStatus).toHaveBeenCalled();
      expect(result).toEqual({ message: expect.any(String) });
    });
  });

  describe('checkQueueStatus', () => {
    it('should return true if queue is running', async () => {
      mockQueue.isPaused.mockResolvedValue(false);
      mockQueue.getJobCounts.mockResolvedValue({ active: 1 });

      const result = await service.checkQueueStatus();

      expect(mockQueue.isPaused).toHaveBeenCalled();
      expect(mockQueue.getJobCounts).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false if queue is paused and has no active jobs', async () => {
      mockQueue.isPaused.mockResolvedValue(true);
      mockQueue.getJobCounts.mockResolvedValue({ active: 0 });

      const result = await service.checkQueueStatus();

      expect(mockQueue.isPaused).toHaveBeenCalled();
      expect(mockQueue.getJobCounts).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('saveAllMakes', () => {
    it('should save all makes using MakesService', async () => {
      const mockMakes = [
        {
          makeId: '1',
          makeName: 'Test',
          vehicleTypes: [{ typeId: '1', typeName: 'Car' }],
        },
      ];
      const mockResult = { nModified: 1 };

      (makesService.updateBulk as jest.Mock).mockResolvedValue(mockResult);

      const result = await service.saveAllMakes(mockMakes);

      expect(makesService.updateBulk).toHaveBeenCalledWith(mockMakes);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getAllMakesXml', () => {
    it('should fetch XML data from the correct URL', async () => {
      const mockXmlResponse = '<mockXml>...</mockXml>';
      global.fetch = jest.fn().mockResolvedValue({
        text: jest.fn().mockResolvedValue(mockXmlResponse),
      });

      const result = await service.getAllMakesXml();

      expect(fetch).toHaveBeenCalledWith(
        'https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=XML',
      );
      expect(result).toBe(mockXmlResponse);
    });
  });

  describe('addVehicleTypes', () => {
    it('should add vehicle types to makes', async () => {
      const mockMakes = [{ makeId: '1', makeName: 'Test', vehicleTypes: [] }];
      const mockXml = '<mockXml>...</mockXml>';
      const mockParsedXml = {
        Results: [{ VehicleTypeId: '1', VehicleTypeName: 'Car' }],
      };
      const mockTypes = [{ typeId: '1', typeName: 'Car' }];

      jest.spyOn(service, 'getVehicleTypesForMake').mockResolvedValue(mockXml);
      jest.spyOn(xmlParser, 'xmlParser').mockResolvedValue(mockParsedXml);
      jest
        .spyOn(mapVehicleTypes, 'transformVehicleTypes')
        .mockReturnValue(mockTypes);

      const result = await service.addVehicleTypes(mockMakes);

      expect(service.getVehicleTypesForMake).toHaveBeenCalledWith('1');
      expect(xmlParser.xmlParser).toHaveBeenCalledWith(mockXml);
      expect(mapVehicleTypes.transformVehicleTypes).toHaveBeenCalledWith(
        mockParsedXml,
      );
      expect(result).toEqual([
        {
          makeId: '1',
          makeName: 'Test',
          vehicleTypes: [{ typeId: '1', typeName: 'Car' }],
        },
      ]);
    });
  });

  describe('getVehicleTypesForMake', () => {
    it('should fetch vehicle types for a make', async () => {
      const mockMakeId = '1';
      const mockXmlResponse = '<mockXml>...</mockXml>';

      global.fetch = jest.fn().mockResolvedValue({
        text: jest.fn().mockResolvedValue(mockXmlResponse),
      });

      const result = await service.getVehicleTypesForMake(mockMakeId);

      expect(fetch).toHaveBeenCalledWith(
        `https://vpic.nhtsa.dot.gov/api/vehicles/GetVehicleTypesForMakeId/${mockMakeId}?format=XML`,
      );
      expect(result).toBe(mockXmlResponse);
    });

    it('should throw an error if fetch fails', async () => {
      const mockMakeId = '1';

      global.fetch = jest.fn().mockRejectedValue(new Error('Fetch failed'));

      await expect(service.getVehicleTypesForMake(mockMakeId)).rejects.toThrow(
        'Fetch failed',
      );
    });
  });
});
