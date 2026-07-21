import { describe, test, expect } from 'bun:test';
import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { collectRoutes } from '../src/collect-routes';
import { inputTypeScript } from './_helpers';

const t = initTRPC.create();

const router = t.router({
  strField: t.procedure.input(z.object({ v: z.string() })).query(() => ''),
  numField: t.procedure.input(z.object({ v: z.number() })).query(() => 0),
  boolField: t.procedure.input(z.object({ v: z.boolean() })).query(() => false),
  arrField: t.procedure.input(z.object({ v: z.array(z.string()) })).query(() => ''),
  recordField: t.procedure.input(z.object({ v: z.record(z.string(), z.number()) })).query(() => ''),
  enumField: t.procedure.input(z.object({ v: z.enum(['a', 'b', 'c']) })).query(() => ''),
  objField: t.procedure
    .input(z.object({ v: z.object({ x: z.number(), y: z.string().optional() }) }))
    .query(() => ''),
  describedField: t.procedure
    .input(
      z.object({
        identifier: z.string().describe('Email address or phone number'),
        password: z.string().describe('Account password'),
        rememberMe: z.boolean().optional().describe('Keep session alive for 30 days'),
        plain: z.string()
      })
    )
    .query(() => ''),
  describedIntersection: t.procedure
    .input(
      z
        .object({ id: z.number().describe('Unique identifier') })
        .and(z.object({ name: z.string().describe('Display name') }))
    )
    .query(() => '')
});

describe('TypeScript type generation', () => {
  test('string field → "string" in TypeScript', () => {
    expect(inputTypeScript(collectRoutes(router), 'strField')).toContain('string');
  });

  test('number field → "number" in TypeScript', () => {
    expect(inputTypeScript(collectRoutes(router), 'numField')).toContain('number');
  });

  test('boolean field → "boolean" in TypeScript', () => {
    expect(inputTypeScript(collectRoutes(router), 'boolField')).toContain('boolean');
  });

  test('array field → string[] or Array<string> in TypeScript', () => {
    expect(inputTypeScript(collectRoutes(router), 'arrField')).toMatch(/string\[\]|Array<string>/);
  });

  test('record field → Record<string, number> in TypeScript', () => {
    const ts = inputTypeScript(collectRoutes(router), 'recordField');
    expect(ts).toContain('Record<string,');
    expect(ts).toContain('number');
  });

  test('enum field → quoted union in TypeScript', () => {
    const ts = inputTypeScript(collectRoutes(router), 'enumField');
    expect(ts).toContain('"a"');
    expect(ts).toContain('"b"');
    expect(ts).toContain('"c"');
  });

  test('object field has ? marker for optional properties', () => {
    expect(inputTypeScript(collectRoutes(router), 'objField')).toMatch(/y\?/);
  });

  test('.describe() text is appended as an inline // comment', () => {
    const ts = inputTypeScript(collectRoutes(router), 'describedField');
    expect(ts).toContain('identifier: string  // Email address or phone number');
    expect(ts).toContain('password: string  // Account password');
    expect(ts).toContain('rememberMe?: boolean  // Keep session alive for 30 days');
  });

  test('fields without .describe() get no trailing comment', () => {
    const ts = inputTypeScript(collectRoutes(router), 'describedField');
    expect(ts).toMatch(/plain: string$/m);
  });

  test('.describe() text is preserved for merged intersection properties', () => {
    const ts = inputTypeScript(collectRoutes(router), 'describedIntersection');
    expect(ts).toContain('id: number  // Unique identifier');
    expect(ts).toContain('name: string  // Display name');
  });
});
