/**
 * A small, dependency-free validator for the JSON Schema subset produced by
 * `collectRoutes()` (see `generate-snippets.ts`'s `generateJSONExample` for the same subset).
 * Used to check that a live API response actually matches the documented output schema.
 */

function typeOf(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function sameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Validate `data` against a JSON Schema object, returning a list of human-readable issues.
 * An empty array means the data matches the schema (as far as this validator can tell).
 *
 * @param data - The value to validate (typically a parsed API response)
 * @param schema - A JSON Schema object (as produced by `collectRoutes()`)
 * @param path - Internal accumulator for the current property path (used in error messages)
 */
export function validateAgainstSchema(data: unknown, schema: any, path: string = '$'): string[] {
  if (!schema || typeof schema !== 'object') return [];

  if (schema.const !== undefined) {
    return sameValue(data, schema.const)
      ? []
      : [`${path}: expected constant ${JSON.stringify(schema.const)}, got ${JSON.stringify(data)}`];
  }

  if (Array.isArray(schema.enum)) {
    return schema.enum.some((v: unknown) => sameValue(v, data))
      ? []
      : [`${path}: expected one of ${JSON.stringify(schema.enum)}, got ${JSON.stringify(data)}`];
  }

  if (Array.isArray(schema.allOf)) {
    return schema.allOf.flatMap((sub: any) => validateAgainstSchema(data, sub, path));
  }

  if (Array.isArray(schema.oneOf) || Array.isArray(schema.anyOf)) {
    const variants: any[] = schema.oneOf ?? schema.anyOf;
    const matchesAny = variants.some(sub => validateAgainstSchema(data, sub, path).length === 0);
    return matchesAny ? [] : [`${path}: does not match any allowed variant`];
  }

  if (!schema.type) return [];

  const expectedTypes: string[] = Array.isArray(schema.type) ? schema.type : [schema.type];
  const actualType = typeOf(data);
  const actualTypeAliases =
    actualType === 'number' && Number.isInteger(data) ? ['number', 'integer'] : [actualType];

  if (!expectedTypes.some(t => actualTypeAliases.includes(t))) {
    return [`${path}: expected type ${expectedTypes.join(' | ')}, got ${actualType}`];
  }

  const issues: string[] = [];

  if (expectedTypes.includes('object') && actualType === 'object') {
    const obj = data as Record<string, unknown>;
    for (const key of schema.required ?? []) {
      if (!(key in obj)) {
        issues.push(`${path}.${key}: missing required field`);
      }
    }
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in obj) {
          issues.push(...validateAgainstSchema(obj[key], propSchema, `${path}.${key}`));
        }
      }
    }
  }

  if (expectedTypes.includes('array') && actualType === 'array' && schema.items) {
    (data as unknown[]).forEach((item, index) => {
      issues.push(...validateAgainstSchema(item, schema.items, `${path}[${index}]`));
    });
  }

  return issues;
}
