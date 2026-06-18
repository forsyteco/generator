import { Module } from "@nestjs/common";
import { GeneratorsController } from "./generators.controller";
import { GeneratorsService } from "./generators.service";
import { InvocationsController } from "./invocations.controller";

@Module({
  controllers: [GeneratorsController, InvocationsController],
  providers: [GeneratorsService],
})
export class GeneratorsModule {}
