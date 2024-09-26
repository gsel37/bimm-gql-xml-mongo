import { Test, TestingModule } from '@nestjs/testing';
import { GovDataController } from './gov-data.controller';
import { GovDataService } from './gov-data.service';

describe('GovDataController', () => {
  let controller: GovDataController;
  let govDataService: GovDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GovDataController],
      providers: [
        {
          provide: GovDataService,
          useValue: {
            processAllMakes: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<GovDataController>(GovDataController);
    govDataService = module.get<GovDataService>(GovDataService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('refresh', () => {
    it('should call processAllMakes and return the result', async () => {
      const mockResult = { updated: 10, inserted: 5 };
      (govDataService.processAllMakes as jest.Mock).mockResolvedValue(
        mockResult,
      );

      const result = await controller.refresh();

      expect(govDataService.processAllMakes).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('should handle errors from processAllMakes', async () => {
      const mockError = new Error('Processing failed');
      (govDataService.processAllMakes as jest.Mock).mockRejectedValue(
        mockError,
      );

      await expect(controller.refresh()).rejects.toThrow('Processing failed');
    });
  });
});
