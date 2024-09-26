import { Test, TestingModule } from '@nestjs/testing';
import { GovDataService } from './gov-data.service';
import { MakesService } from '../makes/makes.service';
import { xml as ALL_MAKES } from '../mocks/all-makes-data';
import * as xmlParser from './transformers/xmlParser';
import * as mapMakes from './transformers/transform-makes';
import * as mapVehicleTypes from './transformers/transform-vehicle-types';

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GovDataService,
        {
          provide: MakesService,
          useClass: MockMakesService,
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
      const mockTransformedMakes = [{ makeId: '1', name: 'Test' }];
      const mockWithVehicleTypes = [
        {
          makeId: '1',
          name: 'Test',
          vehicleTypes: [{ typeId: '1', typeName: 'Car' }],
        },
      ];

      jest.spyOn(xmlParser, 'xmlParser').mockResolvedValue(mockXmlParserResult);
      jest
        .spyOn(mapMakes, 'transformMakes')
        .mockReturnValue(mockTransformedMakes);
      jest
        .spyOn(service, 'addVehicleTypes')
        .mockResolvedValue(mockWithVehicleTypes);
      jest.spyOn(service, 'saveAllMakes').mockResolvedValue({ nModified: 1 });

      const result = await service.processAllMakes();

      expect(xmlParser.xmlParser).toHaveBeenCalledWith(ALL_MAKES);
      expect(mapMakes.transformMakes).toHaveBeenCalledWith(mockXmlParserResult);
      expect(service.addVehicleTypes).toHaveBeenCalled();
      expect(service.saveAllMakes).toHaveBeenCalledWith(mockWithVehicleTypes);
      expect(result).toEqual({ nModified: 1 });
    });
  });

  describe('saveAllMakes', () => {
    it('should save all makes using MakesService', async () => {
      const mockMakes = [
        {
          makeId: '1',
          name: 'Test',
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
    it('should return the mock XML data', async () => {
      const result = await service.getAllMakesXml();
      expect(result).toBe(ALL_MAKES);
    });
  });

  describe('addVehicleTypes', () => {
    it('should add vehicle types to makes', async () => {
      const mockMakes = [{ makeId: '1', name: 'Test', vehicleTypes: [] }];
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
          name: 'Test',
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
