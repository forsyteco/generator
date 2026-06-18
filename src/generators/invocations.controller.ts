import { Body, Controller, HttpCode, Param, Post } from "@nestjs/common";
import { GeneratorsService } from "./generators.service";
import { InvocationForm } from "./types";

@Controller("invocations")
export class InvocationsController {
  constructor(private readonly generatorsService: GeneratorsService) {}

  @Post(":key")
  @HttpCode(200)
  invoke(@Param("key") key: string, @Body() form: InvocationForm) {
    return this.generatorsService.invoke(key, form);
  }
}
