import { Logger } from '@nestjs/common';
import { xmlParser } from './xmlParser';
import * as xml2js from 'xml2js';

jest.mock('xml2js', () => ({
  parseStringPromise: jest.fn(),
}));

jest.mock('@nestjs/common', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    debug: jest.fn(),
    error: jest.fn(),
  })),
}));

describe('xmlParser', () => {
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

  it('should parse valid XML successfully', async () => {
    const mockXmlData =
      '<Response><Count>1</Count><Results>Test</Results></Response>';
    const mockParsedData = {
      Response: {
        Count: ['1'],
        Results: ['Test'],
      },
    };

    (xml2js.parseStringPromise as jest.Mock).mockResolvedValue(mockParsedData);

    const result = await xmlParser(mockXmlData);

    expect(result).toEqual(mockParsedData);
    expect(xml2js.parseStringPromise).toHaveBeenCalledWith(mockXmlData);
    expect(mockLoggerInstance.debug).toHaveBeenCalledWith(
      '1 record(s) parsed to JSON...',
    );
  });

  it('should handle XML without Count', async () => {
    const mockXmlData = '<Response><Results>Test</Results></Response>';
    const mockParsedData = {
      Response: {
        Results: ['Test'],
      },
    };

    (xml2js.parseStringPromise as jest.Mock).mockResolvedValue(mockParsedData);

    const result = await xmlParser(mockXmlData);

    expect(result).toEqual(mockParsedData);
    expect(xml2js.parseStringPromise).toHaveBeenCalledWith(mockXmlData);
    expect(mockLoggerInstance.debug).toHaveBeenCalledWith(
      'Unknown number of record(s) parsed to JSON...',
    );
  });

  it('should throw error for XML without Response', async () => {
    const mockXmlData = '<AnyResponse>Test</AnyResponse>';
    const mockParsedData = {
      AnyResponse: ['Test'],
    };

    (xml2js.parseStringPromise as jest.Mock).mockResolvedValue(mockParsedData);

    await xmlParser(mockXmlData);

    expect(xml2js.parseStringPromise).toHaveBeenCalledWith(mockXmlData);
    expect(mockLoggerInstance.error).toHaveBeenCalledWith(
      'error',
      expect.any(Error),
    );
    expect(mockLoggerInstance.error.mock.calls[0][1].message).toBe(
      'Invalid XML',
    );
  });

  it('should throw error for XML without Results', async () => {
    const mockXmlData = '<Response><Count>1</Count></Response>';
    const mockParsedData = {
      Response: {
        Count: ['1'],
      },
    };

    (xml2js.parseStringPromise as jest.Mock).mockResolvedValue(mockParsedData);

    await xmlParser(mockXmlData);

    expect(xml2js.parseStringPromise).toHaveBeenCalledWith(mockXmlData);
    expect(mockLoggerInstance.error).toHaveBeenCalledWith(
      'error',
      expect.any(Error),
    );
    expect(mockLoggerInstance.error.mock.calls[0][1].message).toBe(
      'Invalid XML',
    );
  });

  it('should handle parsing error', async () => {
    const mockXmlData = 'invalid xml';
    const mockError = new Error('XML parsing failed');

    (xml2js.parseStringPromise as jest.Mock).mockRejectedValue(mockError);

    const result = await xmlParser(mockXmlData);

    expect(result).toBeUndefined();
    expect(xml2js.parseStringPromise).toHaveBeenCalledWith(mockXmlData);
    expect(mockLoggerInstance.error).toHaveBeenCalledWith('error', mockError);
  });

  it('should handle empty input', async () => {
    const mockXmlData = '';
    const mockError = new Error('XML parsing failed');

    (xml2js.parseStringPromise as jest.Mock).mockRejectedValue(mockError);

    const result = await xmlParser(mockXmlData);

    expect(result).toBeUndefined();
    expect(xml2js.parseStringPromise).toHaveBeenCalledWith(mockXmlData);
    expect(mockLoggerInstance.error).toHaveBeenCalledWith('error', mockError);
  });
});
