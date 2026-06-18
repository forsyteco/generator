/**
 * Generate code from forsyteco-spec via the local generator service.
 * Mimics: apibuilder code forsyte <app> 0.0.1 <generator> .
 *
 * Usage:
 *   pnpm start:dev                    # terminal 1
 *   pnpm generate address             # terminal 2
 *   pnpm generate feature_flag client organisation
 */
import { mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");
const specDir = join(repoRoot, "../forsyteco-spec");
const outRoot = join(repoRoot, "generated");
const baseUrl = process.env.GENERATOR_URL ?? "http://127.0.0.1:7050";
const HEALTHCHECK_RETRIES = 30;
const HEALTHCHECK_INTERVAL_MS = 1000;

async function waitForServer() {
  for (let attempt = 1; attempt <= HEALTHCHECK_RETRIES; attempt += 1) {
    try {
      const health = await fetch(`${baseUrl}/_internal_/healthcheck`);
      if (health.ok) {
        return;
      }
    } catch {
      // server not ready yet
    }
    if (attempt === 1) {
      console.log(`Waiting for generator at ${baseUrl}...`);
    }
    await new Promise((resolve) => setTimeout(resolve, HEALTHCHECK_INTERVAL_MS));
  }
  console.error(`Generator not reachable at ${baseUrl}`);
  console.error("Start it first: pnpm start:dev");
  process.exit(1);
}

const STANDARD_IMPORTS = ["error.json", "healthcheck.json", "common.json"];
const GENERATORS = ["forsyte_nestjs_dtos", "forsyte_nestjs_controllers"];

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

function buildForm(specName) {
  const specFile = specName.endsWith(".json") ? specName : `${specName}.json`;
  const spec = loadSpec(specFile);
  const importFiles = specName === "healthcheck.json" || specName === "healthcheck" ? [] : STANDARD_IMPORTS;
  return {
    service: wrapService(spec, spec.name),
    imported_services: importFiles.map((file) => {
      const imported = loadSpec(file);
      return wrapService(imported, imported.name);
    }),
    attributes: [],
  };
}

async function invoke(generatorKey, form) {
  const response = await fetch(`${baseUrl}/invocations/${generatorKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${generatorKey} failed (${response.status}): ${text}`);
  }
  return response.json();
}

function writeFiles(files) {
  for (const file of files) {
    const dir = join(repoRoot, file.dir);
    mkdirSync(dir, { recursive: true });
    const path = join(dir, file.name);
    writeFileSync(path, file.contents, "utf8");
    console.log(`  wrote ${file.dir}/${file.name}`);
  }
}

async function generateApp(specName) {
  const specFile = specName.endsWith(".json") ? specName : `${specName}.json`;
  const spec = loadSpec(specFile);
  const form = buildForm(specName);

  console.log(`\n${spec.name} (from ${specFile})`);

  for (const generatorKey of GENERATORS) {
    const { files } = await invoke(generatorKey, form);
    if (files.length === 0) {
      console.log(`  ${generatorKey}: (no files)`);
      continue;
    }
    console.log(`  ${generatorKey}:`);
    writeFiles(files);
  }
}

const apps = process.argv.slice(2);
if (apps.length === 0) {
  console.error("Usage: pnpm generate <app> [app2 ...]");
  console.error("Example: pnpm generate address feature_flag");
  process.exit(1);
}

await waitForServer();

rmSync(outRoot, { recursive: true, force: true });
mkdirSync(outRoot, { recursive: true });

console.log(`Generating into ${outRoot}/`);
console.log(`Server: ${baseUrl}`);

for (const app of apps) {
  await generateApp(app);
}

console.log(`\nDone. Open: ${outRoot}`);
