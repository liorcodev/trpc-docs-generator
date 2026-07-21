import type { RouteInfo } from './collect-routes.js';

/**
 * Options controlling how code snippets are generated for a route.
 */
export type SnippetOptions = {
  /**
   * Data transformer used by the tRPC router (mirrors `DocsGeneratorOptions.transformer`).
   * When set to 'superjson', request payloads are wrapped in `{ json: ... }` to match the
   * wire format expected by a superjson-enabled tRPC server.
   */
  transformer?: 'superjson';
  /**
   * Token used as a stand-in for the real endpoint base URL. Replaced at runtime (client-side)
   * once the user configures their base URL, or left as-is for the reader to substitute manually.
   * @default '{{BASE_URL}}'
   */
  baseUrlPlaceholder?: string;
};

/**
 * Ready-to-copy code snippets demonstrating how to call a single route.
 */
export type RouteSnippets = {
  curl: string;
  fetch: string;
  trpcClient: string;
};

const DEFAULT_PLACEHOLDER = '{{BASE_URL}}';

function parseExample(inputExample?: string): unknown {
  if (!inputExample) return undefined;
  try {
    return JSON.parse(inputExample);
  } catch {
    return undefined;
  }
}

function wrapForWire(input: unknown, transformer?: 'superjson'): unknown {
  if (transformer === 'superjson' && input !== undefined) {
    return { json: input };
  }
  return input;
}

/**
 * Generate a curl command for calling the given route.
 */
export function generateCurlSnippet(route: RouteInfo, options: SnippetOptions = {}): string {
  const placeholder = options.baseUrlPlaceholder ?? DEFAULT_PLACEHOLDER;
  const method = route.type === 'query' ? 'GET' : 'POST';
  const input = parseExample(route.inputExample);
  const wireInput = wrapForWire(input, options.transformer);
  const url = `${placeholder}/${route.path}`;

  if (method === 'GET') {
    if (wireInput !== undefined) {
      const encoded = encodeURIComponent(JSON.stringify(wireInput));
      return `curl -X GET '${url}?input=${encoded}' \\\n  -H 'Content-Type: application/json'`;
    }
    return `curl -X GET '${url}' \\\n  -H 'Content-Type: application/json'`;
  }

  if (wireInput !== undefined) {
    const body = JSON.stringify(wireInput).replace(/'/g, "'\\''");
    return `curl -X POST '${url}' \\\n  -H 'Content-Type: application/json' \\\n  -d '${body}'`;
  }
  return `curl -X POST '${url}' \\\n  -H 'Content-Type: application/json'`;
}

/**
 * Generate a plain `fetch()` snippet for calling the given route.
 */
export function generateFetchSnippet(route: RouteInfo, options: SnippetOptions = {}): string {
  const placeholder = options.baseUrlPlaceholder ?? DEFAULT_PLACEHOLDER;
  const method = route.type === 'query' ? 'GET' : 'POST';
  const input = parseExample(route.inputExample);
  const wireInput = wrapForWire(input, options.transformer);

  if (method === 'GET') {
    const urlLines =
      wireInput !== undefined
        ? `const input = ${JSON.stringify(wireInput, null, 2)};\nconst url = '${placeholder}/${route.path}?input=' + encodeURIComponent(JSON.stringify(input));`
        : `const url = '${placeholder}/${route.path}';`;

    return `${urlLines}\n\nconst response = await fetch(url, {\n  method: 'GET',\n  headers: { 'Content-Type': 'application/json' }\n});\n\nconst data = await response.json();\nconsole.log(data);`;
  }

  const bodyOption =
    wireInput !== undefined
      ? `,\n  body: JSON.stringify(${JSON.stringify(wireInput, null, 2)})`
      : '';

  return `const response = await fetch('${placeholder}/${route.path}', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' }${bodyOption}\n});\n\nconst data = await response.json();\nconsole.log(data);`;
}

/**
 * Generate a `@trpc/client` snippet for calling the given route using a typed vanilla client.
 */
export function generateTrpcClientSnippet(route: RouteInfo, options: SnippetOptions = {}): string {
  const placeholder = options.baseUrlPlaceholder ?? DEFAULT_PLACEHOLDER;
  const input = parseExample(route.inputExample);
  const args = input !== undefined ? JSON.stringify(input, null, 2) : '';

  const header = `import { createTRPCClient, httpBatchLink } from '@trpc/client';\nimport type { AppRouter } from './router'; // adjust to your router's type export\n\nconst client = createTRPCClient<AppRouter>({\n  links: [httpBatchLink({ url: '${placeholder}' })]\n});\n\n`;

  if (route.type === 'subscription') {
    return `${header}const subscription = client.${route.path}.subscribe(${args}, {\n  onData(data) {\n    console.log(data);\n  },\n  onError(err) {\n    console.error(err);\n  }\n});`;
  }

  const methodName = route.type === 'mutation' ? 'mutate' : 'query';
  return `${header}const result = await client.${route.path}.${methodName}(${args});\nconsole.log(result);`;
}

/**
 * Generate all available code snippets (curl, fetch, and tRPC client) for a single route.
 */
export function generateSnippets(route: RouteInfo, options: SnippetOptions = {}): RouteSnippets {
  return {
    curl: generateCurlSnippet(route, options),
    fetch: generateFetchSnippet(route, options),
    trpcClient: generateTrpcClientSnippet(route, options)
  };
}
