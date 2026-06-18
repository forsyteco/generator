import { Module } from "@nestjs/common";
import { GeneratorsModule } from "./generators/generators.module";
import { HealthController } from "./health/health.controller";

@Module({
  imports: [GeneratorsModule],
  controllers: [HealthController],
})
export class AppModule {}
