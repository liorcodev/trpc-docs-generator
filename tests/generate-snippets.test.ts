import { describe, test, expect } from 'bun:test';
import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { collectRoutes } from '../src/collect-routes';
import {
  generateCurlSnippet,
  generateFetchSnippet,
  generateTrpcClientSnippet,
  generateSnippets
} from '../src/generate-snippets';
import { getRoute } from './_helpers';

const t = initTRPC.create();

const router = t.router({
  getUser: t.procedure.input(z.object({ id: z.string() })).query(() => ({ id: '1' })),
  createPost: t.procedure
    .input(z.object({ title: z.string() }))
    .mutation(() => ({ id: '1', title: '' })),
  ping: t.procedure.query(() => 'pong')
});

describe('generateCurlSnippet', () => {
  test('query with input uses GET and an encoded ?input= query param', () => {
    const route = getRoute(collectRoutes(router), 'getUser');
    const snippet = generateCurlSnippet(route);
    expect(snippet).toContain('curl -X GET');
    expect(snippet).toContain('{{BASE_URL}}/getUser?input=');
  });

  test('mutation uses POST with a JSON -d body', () => {
    const route = getRoute(collectRoutes(router), 'createPost');
    const snippet = generateCurlSnippet(route);
    expect(snippet).toContain('curl -X POST');
    expect(snippet).toContain("-d '");
    expect(snippet).toContain('"title"');
  });

  test('query without input has no ?input= query param', () => {
    const route = getRoute(collectRoutes(router), 'ping');
    const snippet = generateCurlSnippet(route);
    expect(snippet).not.toContain('?input=');
  });

  test('respects a custom baseUrlPlaceholder', () => {
    const route = getRoute(collectRoutes(router), 'ping');
    const snippet = generateCurlSnippet(route, {
      baseUrlPlaceholder: 'http://localhost:3000/trpc'
    });
    expect(snippet).toContain('http://localhost:3000/trpc/ping');
  });

  test('wraps input in {json: ...} when transformer is superjson', () => {
    const route = getRoute(collectRoutes(router), 'createPost');
    const snippet = generateCurlSnippet(route, { transformer: 'superjson' });
    expect(snippet).toContain('"json":{"title"');
  });
});

describe('generateFetchSnippet', () => {
  test('query with input builds an encodeURIComponent url', () => {
    const route = getRoute(collectRoutes(router), 'getUser');
    const snippet = generateFetchSnippet(route);
    expect(snippet).toContain("method: 'GET'");
    expect(snippet).toContain('encodeURIComponent(JSON.stringify(input))');
  });

  test('mutation includes a JSON.stringify body option', () => {
    const route = getRoute(collectRoutes(router), 'createPost');
    const snippet = generateFetchSnippet(route);
    expect(snippet).toContain("method: 'POST'");
    expect(snippet).toContain('body: JSON.stringify(');
  });

  test('query without input omits the input variable', () => {
    const route = getRoute(collectRoutes(router), 'ping');
    const snippet = generateFetchSnippet(route);
    expect(snippet).not.toContain('const input =');
  });
});

describe('generateTrpcClientSnippet', () => {
  test('query renders a .query(...) call using the dotted path', () => {
    const route = getRoute(collectRoutes(router), 'getUser');
    const snippet = generateTrpcClientSnippet(route);
    expect(snippet).toContain('client.getUser.query(');
    expect(snippet).toContain("import { createTRPCClient, httpBatchLink } from '@trpc/client';");
  });

  test('mutation renders a .mutate(...) call', () => {
    const route = getRoute(collectRoutes(router), 'createPost');
    const snippet = generateTrpcClientSnippet(route);
    expect(snippet).toContain('client.createPost.mutate(');
  });
});

describe('generateSnippets', () => {
  test('returns curl, fetch, and trpcClient snippets together', () => {
    const route = getRoute(collectRoutes(router), 'getUser');
    const snippets = generateSnippets(route);
    expect(snippets.curl).toContain('curl');
    expect(snippets.fetch).toContain('fetch(');
    expect(snippets.trpcClient).toContain('client.getUser.query(');
  });
});
