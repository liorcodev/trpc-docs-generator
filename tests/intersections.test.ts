import { describe, test, expect } from 'bun:test';
import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { collectRoutes } from '../src/collect-routes';
import { inputSchema, inputExample, inputTypeScript } from './_helpers';

const t = initTRPC.create();

const Base = z.object({ id: z.number() });
const Extra = z.object({ name: z.string() });

const router = t.router({
  merged: t.procedure.input(Base.and(Extra)).query(() => '')
});

describe('intersection types', () => {
  test('z.intersection does not throw', () => {
    expect(() => collectRoutes(router)).not.toThrow();
  });

  test('intersection schema contains allOf', () => {
    const schema = inputSchema(collectRoutes(router), 'merged');
    expect(schema.allOf).toBeDefined();
    expect(Array.isArray(schema.allOf)).toBe(true);
  });

  test('intersection example has fields from both sides', () => {
    const ex = inputExample(collectRoutes(router), 'merged');
    expect(ex).toHaveProperty('id');
    expect(ex).toHaveProperty('name');
  });

  test('intersection TypeScript type contains both field names', () => {
    const ts = inputTypeScript(collectRoutes(router), 'merged');
    expect(ts).toContain('id');
    expect(ts).toContain('name');
  });
});
