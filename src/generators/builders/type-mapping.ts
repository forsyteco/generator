import pluralize from "pluralize";
import { ApibuilderServiceJson } from "../types";
import {
  applicationKeyToKebab,
  enumKeyToClassName,
  generatedDir,
  generatedFileName,
  generatedSiblingImport,
  modelKeyToClassName,
  resolveApplicationKey,
  toPascalCase,
} from "./naming";

export interface TypeResolution {
  tsType: string;
  imports: Set<string>;
}

function parseArrayType(type: string): string | null {
  const match = /^\[(.+)\]$/.exec(type);
  return match?.[1] ?? null;
}

function parseMapType(type: string): string | null {
  const match = /^map\[(.+)\]$/.exec(type);
  return match?.[1] ?? null;
}

function fqTypeToImport(type: string, importedServices: ApibuilderServiceJson[]): string | null {
  const match = /^co\.forsyte\.([a-z_]+)\.v0\.models\.([a-z_]+)$/.exec(type);
  if (!match) {
    return null;
  }
  const [, appKey, modelKey] = match;
  const owner = importedServices.find((s) => resolveApplicationKey(s) === appKey);
  if (!owner) {
    return null;
  }
  const appKebab = applicationKeyToKebab(appKey);
  return `import { ${modelKeyToClassName(modelKey)} } from "../${appKebab}/${appKebab}-dtos";`;
}

export function resolveType(
  type: string,
  rootService: ApibuilderServiceJson,
  importedServices: ApibuilderServiceJson[],
): TypeResolution {
  const imports = new Set<string>();

  if (type === "unit") {
    return { tsType: "void", imports };
  }

  const arrayInner = parseArrayType(type);
  if (arrayInner) {
    const inner = resolveType(arrayInner, rootService, importedServices);
    inner.imports.forEach((i) => imports.add(i));
    return { tsType: `${inner.tsType}[]`, imports };
  }

  const mapInner = parseMapType(type);
  if (mapInner) {
    const inner = resolveType(mapInner, rootService, importedServices);
    inner.imports.forEach((i) => imports.add(i));
    return { tsType: `Record<string, ${inner.tsType}>`, imports };
  }

  const externalImport = fqTypeToImport(type, importedServices);
  if (externalImport) {
    imports.add(externalImport);
    const modelKey = type.split(".").pop() ?? type;
    return { tsType: modelKeyToClassName(modelKey), imports };
  }

  if (rootService.enums?.[type]) {
    return { tsType: enumKeyToClassName(type), imports };
  }

  if (rootService.models?.[type]) {
    return { tsType: modelKeyToClassName(type), imports };
  }

  switch (type) {
    case "string":
    case "uuid":
    case "date-iso8601":
    case "date-time-iso8601":
      return { tsType: "string", imports };
    case "integer":
    case "long":
      return { tsType: "number", imports };
    case "double":
    case "decimal":
      return { tsType: "number", imports };
    case "boolean":
      return { tsType: "boolean", imports };
    case "json":
    case "object":
      return { tsType: "Record<string, unknown>", imports };
    default:
      return { tsType: "unknown", imports };
  }
}

export function resourceKeyToControllerClassName(resourceKey: string, resourcePath: string): string {
  if (resourceKey.includes(".")) {
    const segment = resourceKey.split(".").pop() ?? resourceKey;
    return `${toPascalCase(pluralize(segment))}Controller`;
  }

  const pathSegment = resourcePath
    .split("/")
    .filter((part) => part && !part.startsWith(":"))
    .pop();

  if (pathSegment) {
    const normalized = pathSegment.replace(/-/g, "_");
    return `${toPascalCase(pluralize(normalized))}Controller`;
  }

  return `${toPascalCase(pluralize(resourceKey))}Controller`;
}

export function operationMethodName(method: string, path?: string): string {
  const verb = method.toLowerCase();
  if (!path) {
    return verb;
  }

  const segments = path
    .split("/")
    .filter(Boolean)
    .map((segment) => toPascalCase(segment.replace(/^:/, "")));

  return `${verb}${segments.join("")}`;
}

import { snakeToCamel } from "./naming";

export function normalizeControllerPath(resourcePath: string): string {
  if (!resourcePath) {
    return "";
  }

  return resourcePath
    .replace(/^\//, "")
    .split("/")
    .map((segment) => {
      if (!segment.startsWith(":")) {
        return segment;
      }
      return `:${snakeToCamel(segment.slice(1))}`;
    })
    .join("/");
}
