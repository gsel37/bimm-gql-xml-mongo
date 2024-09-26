import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MakesService } from './makes.service';
import { Make, MakeSchema } from './schemas/make.schema';
import { MakeResolver } from './makes.resolver';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Make.name, schema: MakeSchema }]),
  ],
  exports: [MakesService],
  providers: [MakesService, MakeResolver],
})
export class MakesModule {}
