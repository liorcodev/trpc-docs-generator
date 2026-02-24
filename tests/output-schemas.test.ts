import { describe, test, expect } from 'bun:test';
import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { collectRoutes } from '../src/collect-routes';
import { getRoute, outputSchema } from './_helpers';

const t = initTRPC.create();

const router = t.router({
  getUser: t.procedure
    .input(z.object({ id: z.string() }))
    .output(z.object({ id: z.string(), name: z.string(), age: z.number().optional() }))
    .query(() => ({ id: '1', name: 'Alice' })),
  noOutput: t.procedure.input(z.object({ id: z.string() })).query(() => ''),
});

describe('output schemas', () => {
  test('outputSchema is defined when .output() is used', () => {
    expect(getRoute(collectRoutes(router), 'getUser').outputSchema).toBeDefined();
  });

  test('outputSchema has correct types', () => {
    const schema = outputSchema(collectRoutes(router), 'getUser');
    expect(schema.properties.id).toMatchObject({ type: 'string' });
    expect(schema.properties.name).toMatchObject({ type: 'string' });
  });

  test('outputExample is generated for output schemas', () => {
    const route = getRoute(collectRoutes(router), 'getUser');
    expect(route.outputExample).toBeDefined();
    const ex = JSON.parse(route.outputExample!);
    expect(ex).toHaveProperty('id');
    expect(ex).toHaveProperty('name');
  });

  test('outputOptionalFields lists optional output fields', () => {
    const route = getRoute(collectRoutes(router), 'getUser');
    const names = route.outputOptionalFields?.map(f => f.name) ?? [];
    expect(names).toContain('age');
  });

  test('outputSchema is undefined when .output() is not used', () => {
    expect(getRoute(collectRoutes(router), 'noOutput').outputSchema).toBeUndefined();
  });
});
