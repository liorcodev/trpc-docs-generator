import { describe, test, expect } from 'bun:test';
import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { collectRoutes } from '../src/collect-routes';
import { inputSchema, inputExample, inputTypeScript } from './_helpers';

const t = initTRPC.create();

const router = t.router({
  strRec: t.procedure
    .input(z.object({ map: z.record(z.string(), z.string()) }))
    .query(() => ''),
  numRec: t.procedure
    .input(z.object({ scores: z.record(z.string(), z.number()) }))
    .query(() => ''),
  objRec: t.procedure
    .input(z.object({ data: z.record(z.string(), z.object({ val: z.boolean() })) }))
    .query(() => ''),
});

describe('record types', () => {
  test('z.record() → type:object in JSON schema', () => {
    expect(inputSchema(collectRoutes(router), 'strRec').properties.map.type).toBe('object');
  });

  test('z.record(z.string(), z.string()) → additionalProperties.type:string', () => {
    expect(
      inputSchema(collectRoutes(router), 'strRec').properties.map.additionalProperties
    ).toMatchObject({ type: 'string' });
  });

  test('z.record(z.string(), z.number()) → additionalProperties.type:number|integer', () => {
    const schema = inputSchema(collectRoutes(router), 'numRec');
    expect(['number', 'integer']).toContain(
      schema.properties.scores.additionalProperties.type
    );
  });

  test('z.record() example is an object with at least one key', () => {
    const ex = inputExample(collectRoutes(router), 'strRec');
    expect(typeof ex.map).toBe('object');
    expect(Object.keys(ex.map).length).toBeGreaterThan(0);
  });

  test('z.record() TypeScript type → Record<string, ...>', () => {
    expect(inputTypeScript(collectRoutes(router), 'strRec')).toContain('Record<string,');
  });
});
