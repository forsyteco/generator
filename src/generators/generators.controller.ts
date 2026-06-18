import { Controller, Get, NotFoundException, Param, Query } from "@nestjs/common";
import { getGenerator, listGeneratorMetadata } from "./generators.registry";

@Controller("generators")
export class GeneratorsController {
  @Get()
  list(@Query("offset") offset?: string, @Query("limit") limit?: string) {
    const all = listGeneratorMetadata();
    const start = offset ? Number(offset) : 0;
    const end = limit ? start + Number(limit) : all.length;
    return all.slice(start, end);
  }

  @Get(":key")
  get(@Param("key") key: string) {
    const generator = getGenerator(key);
    if (!generator) {
      throw new NotFoundException();
    }
    const { generate: _generate, ...metadata } = generator;
    return metadata;
  }
}
