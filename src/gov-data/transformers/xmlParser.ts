import { Logger } from '@nestjs/common';
import { convertableToString, parseStringPromise } from 'xml2js';

export async function xmlParser(xmlData: convertableToString): Promise<any> {
  const logger = new Logger('xmlParser');
  try {
    const parsed = await parseStringPromise(xmlData);
    if (!parsed?.Response || !parsed?.Response?.Results)
      throw Error('Invalid XML');

    logger.debug(
      `${parsed?.Response?.Count ?? 'Unknown number of'} record(s) parsed to JSON...`,
    );
    return parsed;
  } catch (error) {
    logger.error('error', error);
  }
}
