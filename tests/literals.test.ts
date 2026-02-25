import { describe, test, expect } from 'bun:test';
import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { collectRoutes } from '../src/collect-routes';
import { inputSchema, inputExample } from './_helpers';

const t = initTRPC.create();

const router = t.router({
  strLit: t.procedure.input(z.object({ v: z.literal('hello') })).query(() => ''),
  numLit: t.procedure.input(z.object({ v: z.literal(42) })).query(() => 0),
  boolLit: t.procedure.input(z.object({ v: z.literal(true) })).query(() => false)
});

describe('literals', () => {
  test('z.literal("hello") → const:"hello" in JSON schema', () => {
    expect(inputSchema(collectRoutes(router), 'strLit').properties.v.const).toBe('hello');
  });

  test('z.literal("hello") → "hello" example', () => {
    expect(inputExample(collectRoutes(router), 'strLit').v).toBe('hello');
  });

  test('z.literal(42) → const:42 in JSON schema', () => {
    expect(inputSchema(collectRoutes(router), 'numLit').properties.v.const).toBe(42);
  });

  test('z.literal(42) → 42 example', () => {
    expect(inputExample(collectRoutes(router), 'numLit').v).toBe(42);
  });

  test('z.literal(true) → const:true in JSON schema', () => {
    expect(inputSchema(collectRoutes(router), 'boolLit').properties.v.const).toBe(true);
  });
});
