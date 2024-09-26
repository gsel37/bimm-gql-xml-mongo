import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MakesModule } from './makes/makes.module';
import { MongooseModule } from '@nestjs/mongoose';
import { GovDataModule } from './gov-data/gov-data.module';
import { ApolloDriverConfig, ApolloDriver } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/bimm'),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      typePaths: ['./**/*.graphql'],
    }),
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    MakesModule,
    GovDataModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
