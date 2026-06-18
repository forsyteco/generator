/**
 * HTTP validation against running generator service (localhost:7050).
 * Run: pnpm start:dev (separate terminal) && node scripts/validate-http.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const specDir = join(__dirname, "../../forsyteco-spec");
const baseUrl = process.env.GENERATOR_URL ?? "http://127.0.0.1:7050";

function loadSpec(filename) {
  return JSON.parse(readFileSync(join(specDir, filename), "utf8"));
}

function wrapService(spec, applicationKey) {
  return {
    ...spec,
    organization: { key: "forsyte" },
    application: { key: applicationKey },
    version: "0.0.1",
  };
}

function buildForm(specFile, importFiles = []) {
  const spec = loadSpec(specFile);
  return {
    service: wrapService(spec, spec.name),
    imported_services: importFiles.map((file) => wrapService(loadSpec(file), loadSpec(file).name)),
    attributes: [],
  };
}

const STANDARD_IMPORTS = ["error.json", "healthcheck.json", "common.json"];

async function invoke(generatorKey, form) {
  const response = await fetch(`${baseUrl}/invocations/${generatorKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });
  const body = await response.json();
  return { status: response.status, body };
}

const checks = [
  { spec: "healthcheck.json", imports: [], dtoFiles: ["healthcheck-dtos.ts"], ctrlFiles: ["healthcheck-controllers.ts"] },
  { spec: "error.json", imports: [], dtoFiles: ["error-dtos.ts"], ctrlFiles: [] },
  { spec: "address.json", imports: STANDARD_IMPORTS, dtoFiles: ["address-enums.ts", "address-dtos.ts"], ctrlFiles: ["address-controllers.ts"] },
  { spec: "feature_flag.json", imports: STANDARD_IMPORTS, dtoFiles: ["feature-flag-dtos.ts"], ctrlFiles: ["feature-flag-controllers.ts"] },
];

let failed = 0;

console.log(`Testing HTTP generator at ${baseUrl}\n`);

try {
  const health = await fetch(`${baseUrl}/_internal_/healthcheck`);
  if (health.status !== 200) {
    throw new Error(`Healthcheck failed: ${health.status}`);
  }
  console.log("PASS  server healthcheck");
} catch (error) {
  console.error("FAIL  server not reachable. Start with: pnpm start:dev");
  process.exit(1);
}

for (const check of checks) {
  const form = buildForm(check.spec, check.imports);
  const label = loadSpec(check.spec).name;

  for (const generatorKey of ["forsyte_nestjs_dtos", "forsyte_nestjs_controllers"]) {
    const expectedFiles = generatorKey.includes("dtos") ? check.dtoFiles : check.ctrlFiles;
    if (expectedFiles.length === 0 && generatorKey.includes("controllers")) {
      const { status, body } = await invoke(generatorKey, form);
      if (status !== 200 || body.files.length !== 0) {
        console.log(`FAIL  ${label} ${generatorKey}: expected empty files, got ${body.files?.length}`);
        failed += 1;
      } else {
        console.log(`PASS  ${label} ${generatorKey} (no resources)`);
      }
      continue;
    }

    const { status, body } = await invoke(generatorKey, form);
    if (status !== 200) {
      console.log(`FAIL  ${label} ${generatorKey}: HTTP ${status}`);
      failed += 1;
      continue;
    }

    const names = body.files.map((f) => f.name);
    const missing = expectedFiles.filter((f) => !names.includes(f));
    if (missing.length > 0) {
      console.log(`FAIL  ${label} ${generatorKey}: missing files ${missing.join(", ")}`);
      failed += 1;
    } else {
      console.log(`PASS  ${label} ${generatorKey} -> ${names.join(", ")}`);
    }
  }
}

if (failed > 0) {
  console.log(`\n${failed} HTTP check(s) failed`);
  process.exit(1);
}

console.log("\nAll HTTP checks passed");
