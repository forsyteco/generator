# Forsyteco Generator

NestJS-hosted [apibuilder](https://www.apibuilder.io) code generator service for Forsyte API specs.

## Generators

| Key | Output |
|-----|--------|
| `forsyte_nestjs_dtos` | `{app}-enums.ts`, `{app}-dtos.ts` in `generated/{application-key}/` |
| `forsyte_nestjs_controllers` | `{app}-controllers.ts` in `generated/{application-key}/` |

Example for `forsyte/address`:

```
generated/address/
├── address-enums.ts
├── address-dtos.ts
└── address-controllers.ts
```

Example for `forsyte/feature_flag`:

```
generated/feature-flag/
├── feature-flag-dtos.ts
└── feature-flag-controllers.ts
```

## Local development

```bash
pnpm install
node test/fixtures/build-fixtures.mjs   # refresh fixtures from forsyteco-spec
pnpm start:dev                          # http://localhost:7050
```

### Smoke test

```bash
curl http://localhost:7050/generators
curl -X POST http://localhost:7050/invocations/forsyte_nestjs_dtos \
  -H "Content-Type: application/json" \
  -d @test/fixtures/forms/address-invocation.json
```

## Tests

```bash
node test/fixtures/build-fixtures.mjs
pnpm test:e2e
```

## Register on apibuilder.io

Expose port 7050 (e.g. via ngrok), then:

```bash
curl -X POST https://api.apibuilder.io/generator_services \
  -H "Authorization: Bearer $APIBUILDER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"uri": "https://<your-public-url>"}'
```

Generate from the UI or CLI:

```bash
apibuilder code forsyte address 0.0.1 forsyte_nestjs_dtos .
```

## Hand-written API integration

```typescript
import { AddressesController as AddressesControllerTrait } from "@/generated/address/address-controllers";

@UseGuards(JwtAuthGuard, IsOrganisationGuard)
export class AddressesController extends AddressesControllerTrait {
  // implement *Hook methods
}
```
