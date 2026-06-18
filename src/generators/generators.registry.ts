import { generateNestJsControllers } from "./implementations/nestjs-controllers/generate-controllers";
import { generateNestJsDtos } from "./implementations/nestjs-dtos/generate-dtos";
import { RegisteredGenerator } from "./types";

export const GENERATORS: Record<string, RegisteredGenerator> = {
  forsyte_nestjs_dtos: {
    key: "forsyte_nestjs_dtos",
    name: "Forsyte NestJS DTOs",
    language: "TypeScript",
    description: "NestJS DTOs with class-validator and Swagger decorators",
    attributes: [],
    generate: generateNestJsDtos,
  },
  forsyte_nestjs_controllers: {
    key: "forsyte_nestjs_controllers",
    name: "Forsyte NestJS Controllers",
    language: "TypeScript",
    description:
      "Controller traits (abstract classes) with routes and response typing — aligned with play_2_9_scala_3_controllers",
    attributes: [
      {
        name: "api_prefix",
        description: "Global route prefix (unused in Phase 1)",
        default: "/v1alpha",
        required: false,
      },
    ],
    generate: generateNestJsControllers,
  },
};

export function listGeneratorMetadata(): Array<Omit<RegisteredGenerator, "generate">> {
  return Object.values(GENERATORS).map(({ generate: _generate, ...metadata }) => metadata);
}

export function getGenerator(key: string): RegisteredGenerator | undefined {
  return GENERATORS[key];
}
