import { describe, test, expect } from 'bun:test';
import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { collectRoutes } from '../src/collect-routes';
import { inputSchema, inputExample, inputTypeScript } from './_helpers';

const t = initTRPC.create();

const router = t.router({
  byStatus: t.procedure
    .input(z.object({ status: z.enum(['active', 'inactive', 'pending']) }))
    .query(() => ''),
});

describe('enums', () => {
  test('z.enum() → type:string in JSON schema', () => {
    expect(inputSchema(collectRoutes(router), 'byStatus').properties.status.type).toBe('string');
  });

  test('z.enum() → enum array in JSON schema', () => {
    expect(inputSchema(collectRoutes(router), 'byStatus').properties.status.enum).toEqual([
      'active',
      'inactive',
      'pending',
    ]);
  });

  test('z.enum() example uses first value', () => {
    expect(inputExample(collectRoutes(router), 'byStatus').status).toBe('active');
  });

  test('z.enum() TypeScript type contains quoted union members', () => {
    const ts = inputTypeScript(collectRoutes(router), 'byStatus');
    expect(ts).toContain('"active"');
    expect(ts).toContain('"inactive"');
    expect(ts).toContain('"pending"');
  });
});
