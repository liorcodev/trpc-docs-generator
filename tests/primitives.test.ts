import { describe, test, expect } from 'bun:test';
import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { collectRoutes } from '../src/collect-routes';
import { inputSchema, inputExample, inputTypeScript } from './_helpers';

const t = initTRPC.create();

const router = t.router({
  str: t.procedure.input(z.object({ v: z.string() })).query(() => ''),
  num: t.procedure.input(z.object({ v: z.number() })).query(() => 0),
  bool: t.procedure.input(z.object({ v: z.boolean() })).query(() => false),
  nullVal: t.procedure.input(z.object({ v: z.null() })).query(() => null),
  intVal: t.procedure.input(z.object({ v: z.number().int() })).query(() => 0)
});

describe('primitive types', () => {
  test('z.string() → type:string in JSON schema', () => {
    expect(inputSchema(collectRoutes(router), 'str').properties.v).toMatchObject({
      type: 'string'
    });
  });

  test('z.string() → "string" example', () => {
    expect(inputExample(collectRoutes(router), 'str').v).toBe('string');
  });

  test('z.string() → string TypeScript type', () => {
    expect(inputTypeScript(collectRoutes(router), 'str')).toContain('string');
  });

  test('z.number() → type:number in JSON schema', () => {
    const schema = inputSchema(collectRoutes(router), 'num');
    expect(['number', 'integer']).toContain(schema.properties.v.type);
  });

  test('z.number() → 0 example', () => {
    expect(inputExample(collectRoutes(router), 'num').v).toBe(0);
  });

  test('z.boolean() → type:boolean in JSON schema', () => {
    expect(inputSchema(collectRoutes(router), 'bool').properties.v).toMatchObject({
      type: 'boolean'
    });
  });

  test('z.boolean() → true example', () => {
    expect(inputExample(collectRoutes(router), 'bool').v).toBe(true);
  });

  test('z.null() → type:null in JSON schema', () => {
    expect(inputSchema(collectRoutes(router), 'nullVal').properties.v).toMatchObject({
      type: 'null'
    });
  });

  test('z.null() → null example', () => {
    expect(inputExample(collectRoutes(router), 'nullVal').v).toBeNull();
  });

  test('z.number().int() → integer or number type in JSON schema', () => {
    const schema = inputSchema(collectRoutes(router), 'intVal');
    expect(['number', 'integer']).toContain(schema.properties.v.type);
  });
});
