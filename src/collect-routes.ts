import type { AnyRouter, AnyProcedure, ProcedureType } from "@trpc/server";
/**
 * Complete information about a single tRPC route/procedure
 */export type RouteInfo = {
  path: string;
  type: ProcedureType;
  meta?: any;
  inputSchema?: string;
  outputSchema?: string;
  inputExample?: string;
  outputExample?: string;
  inputTypeScript?: string;
  outputTypeScript?: string;
  inputOptionalFields?: { name: string; example: string }[];
  outputOptionalFields?: { name: string; example: string }[];
};

/**
 * Generate a JSON example from a JSON schema string
 * @param schemaJson - JSON schema as string
 * @returns JSON example string or undefined if parsing fails
 */
function generateExampleFromSchema(schemaJson: string): string | undefined {
  try {
    const schema = JSON.parse(schemaJson);
    return generateJSONExample(schema);
  } catch {
    return undefined;
  }
}

/**
 * Generate TypeScript type definition from a JSON schema string
 * @param schemaJson - JSON schema as string
 * @returns TypeScript type definition or undefined if parsing fails
 */
function generateTypeScriptFromSchema(schemaJson: string): string | undefined {
  try {
    const schema = JSON.parse(schemaJson);
    return generateTypeScriptExample(schema);
  } catch {
    return undefined;
  }
}

function extractOptionalFields(
  schemaJson: string,
): { name: string; example: string }[] | undefined {
  try {
    const schema = JSON.parse(schemaJson);
    return getOptionalFields(schema);
  } catch {
    return undefined;
  }
}

function getOptionalFields(
  schema: any,
  depth: number = 0,
): { name: string; example: string }[] {
  const optionalFields: { name: string; example: string }[] = [];

  if (!schema || typeof schema !== "object") return optionalFields;

  // Handle allOf
  if (schema.allOf && Array.isArray(schema.allOf)) {
    const allProps: Record<string, any> = {};
    const allRequired = new Set<string>();

    for (const subSchema of schema.allOf) {
      if (subSchema.type === "object" && subSchema.properties) {
        Object.assign(allProps, subSchema.properties);
      }
      if (subSchema.required) {
        subSchema.required.forEach((r: string) => allRequired.add(r));
      }
    }

    for (const [key, propSchema] of Object.entries(allProps)) {
      if (!allRequired.has(key)) {
        const example = generateJSONExample(propSchema as any, 0, true);
        optionalFields.push({ name: key, example });
      }
    }
    return optionalFields;
  }

  if (schema.type === "object" && schema.properties) {
    const required = new Set(schema.required || []);

    for (const [key, propSchema] of Object.entries(schema.properties)) {
      if (!required.has(key)) {
        const example = generateJSONExample(propSchema as any, 0, true);
        optionalFields.push({ name: key, example });
      }
    }
  }

  return optionalFields;
}

function generateJSONExample(
  schema: any,
  depth: number = 0,
  includeOptional: boolean = false,
): string {
  if (!schema || typeof schema !== "object") return '"value"';

  const indent = "  ".repeat(depth);
  const nextIndent = "  ".repeat(depth + 1);

  // Handle const (Zod literals)
  if (schema.const !== undefined) {
    if (typeof schema.const === "string") {
      return `"${schema.const}"`;
    }
    return JSON.stringify(schema.const);
  }

  // Handle allOf (intersections)
  if (schema.allOf && Array.isArray(schema.allOf)) {
    const objects: any[] = [];

    for (const subSchema of schema.allOf) {
      if (subSchema.type === "object" && subSchema.properties) {
        objects.push(subSchema);
      }
    }

    if (objects.length > 0) {
      const allProps: Record<string, any> = {};
      const allRequired = new Set<string>();

      for (const obj of objects) {
        if (obj.properties) {
          Object.assign(allProps, obj.properties);
        }
        if (obj.required) {
          obj.required.forEach((r: string) => allRequired.add(r));
        }
      }

      const props: string[] = [];
      for (const [key, propSchema] of Object.entries(allProps)) {
        const isRequired = allRequired.has(key);
        // Only include optional fields if requested
        if (isRequired || includeOptional) {
          const propValue = generateJSONExample(
            propSchema as any,
            depth + 1,
            includeOptional,
          );
          props.push(`${nextIndent}"${key}": ${propValue}`);
        }
      }

      return `{\n${props.join(",\n")}\n${indent}}`;
    }
  }

  // Handle oneOf/anyOf (unions) - use first option
  if (schema.oneOf && Array.isArray(schema.oneOf) && schema.oneOf.length > 0) {
    return generateJSONExample(schema.oneOf[0], depth, includeOptional);
  }

  if (schema.anyOf && Array.isArray(schema.anyOf) && schema.anyOf.length > 0) {
    return generateJSONExample(schema.anyOf[0], depth, includeOptional);
  }

  switch (schema.type) {
    case "object": {
      if (!schema.properties || Object.keys(schema.properties).length === 0) {
        return "{}";
      }

      const required = new Set(schema.required || []);
      const props: string[] = [];

      for (const [key, propSchema] of Object.entries(schema.properties)) {
        const isRequired = required.has(key);
        // Only include optional fields if requested
        if (isRequired || includeOptional) {
          const propValue = generateJSONExample(
            propSchema as any,
            depth + 1,
            includeOptional,
          );
          props.push(`${nextIndent}"${key}": ${propValue}`);
        }
      }

      return `{\n${props.join(",\n")}\n${indent}}`;
    }

    case "array": {
      if (schema.items) {
        const itemValue = generateJSONExample(
          schema.items,
          depth + 1,
          includeOptional,
        );
        return `[${itemValue}]`;
      }
      return "[]";
    }

    case "string": {
      if (schema.enum && schema.enum.length > 0) {
        return `"${schema.enum[0]}"`;
      }
      return '"string"';
    }

    case "number":
    case "integer":
      return "0";

    case "boolean":
      return "true";

    case "null":
      return "null";

    default:
      return '"value"';
  }
}

/**
 * Generate TypeScript type definition from a parsed schema object
 * @param schema - Parsed JSON schema object
 * @param depth - Current indentation depth (default: 0)
 * @returns TypeScript type definition string
 */
function generateTypeScriptExample(schema: any, depth: number = 0): string {
  if (!schema || typeof schema !== "object") return "any";

  const indent = "  ".repeat(depth);
  const nextIndent = "  ".repeat(depth + 1);

  // Handle const (Zod literals)
  if (schema.const !== undefined) {
    if (typeof schema.const === "string") {
      return `"${schema.const}"`;
    }
    return JSON.stringify(schema.const);
  }

  // Handle allOf (intersections)
  if (schema.allOf && Array.isArray(schema.allOf)) {
    const objects: any[] = [];
    const nonObjects: any[] = [];

    // Separate object schemas from other schemas (like unions)
    for (const subSchema of schema.allOf) {
      if (subSchema.type === "object" && subSchema.properties) {
        objects.push(subSchema);
      } else {
        // Could be anyOf, oneOf, or other non-object schemas
        nonObjects.push(subSchema);
      }
    }

    // If we have both objects and non-objects, we need to intersect them
    if (objects.length > 0) {
      // Merge all object properties
      const allProps: Record<string, any> = {};
      const allRequired = new Set<string>();

      for (const obj of objects) {
        if (obj.properties) {
          Object.assign(allProps, obj.properties);
        }
        if (obj.required) {
          obj.required.forEach((r: string) => allRequired.add(r));
        }
      }

      const props: string[] = [];
      for (const [key, propSchema] of Object.entries(allProps)) {
        const isRequired = allRequired.has(key);
        const propType = generateTypeScriptExample(
          propSchema as any,
          depth + 1,
        );
        const optionalMark = isRequired ? "" : "?";
        props.push(`${nextIndent}${key}${optionalMark}: ${propType}`);
      }

      const objectType = `{\n${props.join("\n")}\n${indent}}`;

      // If there are non-object schemas (like unions), intersect with them
      if (nonObjects.length > 0) {
        const nonObjectTypes = nonObjects.map((s) =>
          generateTypeScriptExample(s, depth),
        );
        return `${objectType} & (${nonObjectTypes.join(" & ")})`;
      }

      return objectType;
    } else if (nonObjects.length > 0) {
      // Only non-object schemas in the intersection
      const types = nonObjects.map((s) => generateTypeScriptExample(s, depth));
      return types.join(" & ");
    }
  }

  // Handle oneOf (unions)
  if (schema.oneOf && Array.isArray(schema.oneOf) && schema.oneOf.length > 0) {
    const types = schema.oneOf.map((s: any) =>
      generateTypeScriptExample(s, depth),
    );
    return types.join(" | ");
  }

  // Handle anyOf (unions - used by z.union in Zod)
  if (schema.anyOf && Array.isArray(schema.anyOf) && schema.anyOf.length > 0) {
    const types = schema.anyOf.map((s: any) =>
      generateTypeScriptExample(s, depth),
    );
    return types.join(" | ");
  }

  switch (schema.type) {
    case "object": {
      if (!schema.properties || Object.keys(schema.properties).length === 0) {
        return "{}";
      }

      const required = new Set(schema.required || []);
      const props: string[] = [];

      for (const [key, propSchema] of Object.entries(schema.properties)) {
        const isRequired = required.has(key);
        const propType = generateTypeScriptExample(
          propSchema as any,
          depth + 1,
        );
        const optionalMark = isRequired ? "" : "?";
        props.push(`${nextIndent}${key}${optionalMark}: ${propType}`);
      }

      return `{\n${props.join("\n")}\n${indent}}`;
    }

    case "array": {
      if (schema.items) {
        const itemType = generateTypeScriptExample(schema.items, depth);
        // If item is an object, keep it compact
        if (itemType.includes("\n")) {
          // Multi-line object in array
          return `Array<${itemType}>`;
        }
        return `${itemType}[]`;
      }
      return "any[]";
    }

    case "string": {
      if (schema.enum && schema.enum.length > 0) {
        return schema.enum.map((v: string) => `"${v}"`).join(" | ");
      }
      return "string";
    }

    case "number":
    case "integer":
      return "number";

    case "boolean":
      return "boolean";

    case "null":
      return "null";

    default:
      return "any";
  }
}

/**
 * Convert a Zod schema to JSON schema string using Zod v4+ toJSONSchema method
 * @param schema - Zod schema object
 * @returns JSON schema as string or undefined if conversion fails
 */
function zodSchemaToString(schema: unknown): string | undefined {
  if (!schema) return undefined;
  try {
    // Check if it has the toJSONSchema method (Zod v4+)
    if (schema && typeof schema === "object" && "toJSONSchema" in schema) {
      const toJSONSchema = (schema as { toJSONSchema: () => unknown })
        .toJSONSchema;
      if (typeof toJSONSchema === "function") {
        const jsonSchema = toJSONSchema();
        return JSON.stringify(jsonSchema, null, 2);
      }
    }
  } catch (error) {
    console.error("Error converting schema:", error);
    return undefined;
  }
  return undefined;
}

/**
 * Traverse a tRPC router and extract all procedure information
 * @param router - tRPC router instance
 * @returns Array of RouteInfo objects for all procedures
 */
function traverseRouter(router: AnyRouter): RouteInfo[] {
  const routes: RouteInfo[] = [];

  // Access the procedures object directly (tRPC flattens all procedures)
  const procedures = router._def.procedures as Record<string, AnyProcedure>;

  if (procedures && typeof procedures === "object") {
    for (const [path, procedure] of Object.entries(procedures)) {
      const procDef = procedure._def as {
        type?: ProcedureType;
        meta?: any;
        inputs?: unknown[];
        output?: unknown;
        $types?: { input?: unknown; output?: unknown };
      };

      const type: ProcedureType = procDef.type || "query";

      const inputSchema =
        procDef.inputs && procDef.inputs.length > 0
          ? zodSchemaToString(procDef.inputs[procDef.inputs.length - 1])
          : undefined;

      const outputSchema = procDef.output
        ? zodSchemaToString(procDef.output)
        : undefined;

      // Auto-generate examples from schemas (required fields only for input)
      const inputExample = inputSchema
        ? generateExampleFromSchema(inputSchema)
        : undefined;
      const outputExample = outputSchema
        ? generateExampleFromSchema(outputSchema)
        : undefined;

      // Auto-generate TypeScript type representations
      const inputTypeScript = inputSchema
        ? generateTypeScriptFromSchema(inputSchema)
        : undefined;
      const outputTypeScript = outputSchema
        ? generateTypeScriptFromSchema(outputSchema)
        : undefined;

      // Extract optional fields
      const inputOptionalFields = inputSchema
        ? extractOptionalFields(inputSchema)
        : undefined;
      const outputOptionalFields = outputSchema
        ? extractOptionalFields(outputSchema)
        : undefined;

      routes.push({
        path,
        type,
        meta: procDef.meta,
        inputSchema,
        outputSchema,
        inputExample,
        outputExample,
        inputTypeScript,
        outputTypeScript,
        inputOptionalFields,
        outputOptionalFields,
      });
    }
  }

  return routes;
}

/**
 * Collect route information from a tRPC router
 * @param router - The tRPC router to collect routes from
 * @returns Array of route information
 */
export function collectRoutes(router: AnyRouter): RouteInfo[] {
  return traverseRouter(router);
}
