import { describe, test, expect } from 'bun:test';
import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { collectRoutes } from '../src/collect-routes';
import { inputSchema, inputExample, inputTypeScript } from './_helpers';

const t = initTRPC.create();

const router = t.router({
  strArr: t.procedure.input(z.object({ tags: z.array(z.string()) })).query(() => ''),
  numArr: t.procedure.input(z.object({ ids: z.array(z.number()) })).query(() => ''),
  objArr: t.procedure
    .input(z.object({ items: z.array(z.object({ id: z.number(), name: z.string() })) }))
    .query(() => '')
});

describe('array types', () => {
  test('z.array(z.string()) → type:array in JSON schema', () => {
    expect(inputSchema(collectRoutes(router), 'strArr').properties.tags.type).toBe('array');
  });

  test('z.array(z.string()) items → type:string', () => {
    expect(inputSchema(collectRoutes(router), 'strArr').properties.tags.items.type).toBe('string');
  });

  test('z.array(z.string()) example is a JSON array', () => {
    const ex = inputExample(collectRoutes(router), 'strArr');
    expect(Array.isArray(ex.tags)).toBe(true);
    expect(ex.tags[0]).toBe('string');
  });

  test('z.array(z.number()) items → type:number|integer', () => {
    const schema = inputSchema(collectRoutes(router), 'numArr');
    expect(['number', 'integer']).toContain(schema.properties.ids.items.type);
  });

  test('z.array(z.object(...)) items → type:object', () => {
    expect(inputSchema(collectRoutes(router), 'objArr').properties.items.items.type).toBe('object');
  });

  test('z.array(z.string()) TypeScript type → string[] or Array<string>', () => {
    expect(inputTypeScript(collectRoutes(router), 'strArr')).toMatch(/string\[\]|Array<string>/);
  });
});
