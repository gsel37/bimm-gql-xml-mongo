import { Resolver, Query, Args } from '@nestjs/graphql';
import { Make } from './schemas/make.schema';
import { MakesService } from './makes.service';

@Resolver(() => Make)
export class MakeResolver {
  constructor(private readonly makesService: MakesService) {}

  @Query(() => [Make])
  async makes(): Promise<Make[]> {
    return this.makesService.findAll();
  }

  @Query(() => Make)
  async make(@Args('makeId') makeId: string): Promise<Make> {
    return this.makesService.findOneByMakeId(makeId);
  }
}
