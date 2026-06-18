export function snakeToCamel(value: string): string {
  return value.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

export function toPascalCase(value: string): string {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");
}

export function applicationKeyToKebab(applicationKey: string): string {
  return applicationKey.replace(/_/g, "-");
}

export function applicationKeyToPascal(applicationKey: string): string {
  return toPascalCase(applicationKey);
}

export function generatedFileName(applicationKey: string, kind: "dtos" | "enums" | "controllers"): string {
  return `${applicationKeyToKebab(applicationKey)}-${kind}.ts`;
}

export function generatedSiblingImport(applicationKey: string, kind: "dtos" | "enums"): string {
  return `./${applicationKeyToKebab(applicationKey)}-${kind}`;
}

export function modelKeyToClassName(modelKey: string): string {
  return `${toPascalCase(modelKey)}Dto`;
}

export function enumKeyToClassName(enumKey: string): string {
  return toPascalCase(enumKey);
}

export function pathParamToDecoratorName(paramName: string): string {
  return snakeToCamel(paramName);
}

export function generatedDir(applicationKey: string): string {
  return `generated/${applicationKeyToKebab(applicationKey)}`;
}

export function resolveApplicationKey(service: { application?: { key: string }; name?: string }): string {
  return service.application?.key ?? service.name ?? "service";
}
