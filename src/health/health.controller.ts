import { Controller, Get } from "@nestjs/common";

@Controller("_internal_")
export class HealthController {
  @Get("healthcheck")
  healthcheck(): string {
    return "healthy";
  }
}
