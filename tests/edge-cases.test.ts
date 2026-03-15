import { describe, test, expect } from 'bun:test';
import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { collectRoutes, __internal } from '../src/collect-routes';
import { getRoute, inputSchema, inputExample } from './_helpers';

const t = initTRPC.create();

const router = t.router({
  // Deeply nested union inside object
  complex: t.procedure
    .input(
      z.object({
        filter: z.union([
          z.object({ type: z.literal('id'), value: z.number() }),
          z.object({ type: z.literal('name'), value: z.string() })
        ])
      })
    )
    .query(() => ''),

  // All-optional object (no required fields at all)
  allOptional: t.procedure
    .input(z.object({ a: z.string().optional(), b: z.number().optional() }))
    .query(() => ''),

  // Nullable date
  nullableDate: t.procedure.input(z.object({ at: z.date().nullable() })).query(() => '')
});

describe('edge cases', () => {
  test('complex nested union does not throw', () => {
    expect(() => collectRoutes(router)).not.toThrow();
  });

  test('all-optional object: example is empty {}', () => {
    expect(inputExample(collectRoutes(router), 'allOptional')).toEqual({});
  });

  test('all-optional object: both fields appear in inputOptionalFields', () => {
    const route = getRoute(collectRoutes(router), 'allOptional');
    const names = route.inputOptionalFields?.map(f => f.name) ?? [];
    expect(names).toContain('a');
    expect(names).toContain('b');
  });

  test('nullable z.date() does not throw', () => {
    expect(() => collectRoutes(router)).not.toThrow();
  });

  test('nullable z.date() schema contains a date-time string variant', () => {
    const atSchema = inputSchema(collectRoutes(router), 'nullableDate').properties.at;
    const variants = atSchema.anyOf ?? atSchema.oneOf ?? [atSchema];
    const dateVariant = variants.find((s: any) => s.format === 'date-time');
    expect(dateVariant).toMatchObject({ type: 'string', format: 'date-time' });
  });

  test('example generator returns undefined for invalid JSON schema string', () => {
    expect(__internal.generateExampleFromSchema('{')).toBeUndefined();
  });

  test('TypeScript generator returns undefined for invalid JSON schema string', () => {
    expect(__internal.generateTypeScriptFromSchema('{')).toBeUndefined();
  });

  test('optional-fields extractor returns undefined for invalid JSON schema string', () => {
    expect(__internal.extractOptionalFields('{')).toBeUndefined();
  });

  test('allOf optional-field extraction includes non-required keys', () => {
    const fields = __internal.getOptionalFields({
      allOf: [
        {
          type: 'object',
          properties: {
            id: { type: 'number' },
            nickname: { type: 'string' }
          },
          required: ['id']
        }
      ]
    });

    expect(fields).toEqual([{ name: 'nickname', example: '"string"' }]);
  });

  test('JSON example handles oneOf by choosing first branch', () => {
    expect(
      __internal.generateJSONExample({ oneOf: [{ type: 'number' }, { type: 'string' }] })
    ).toBe('0');
  });

  test('JSON example handles array schema without items', () => {
    expect(__internal.generateJSONExample({ type: 'array' })).toBe('[]');
  });

  test('JSON example handles date format and unknown schemas', () => {
    expect(__internal.generateJSONExample({ type: 'string', format: 'date' })).toBe('"2024-01-01"');
    expect(__internal.generateJSONExample({ allOf: [{ type: 'string' }] })).toBe('"value"');
  });

  test('TypeScript generation handles allOf object and non-object intersections', () => {
    const ts = __internal.generateTypeScriptExample({
      allOf: [
        {
          type: 'object',
          properties: { id: { type: 'number' } },
          required: ['id']
        },
        {
          oneOf: [{ type: 'string' }, { type: 'number' }]
        }
      ]
    });

    expect(ts).toContain('id: number');
    expect(ts).toContain('& (string | number)');
  });

  test('TypeScript generation handles allOf with only non-objects', () => {
    expect(
      __internal.generateTypeScriptExample({ allOf: [{ type: 'string' }, { type: 'number' }] })
    ).toBe('string & number');
  });

  test('TypeScript generation handles oneOf, arrays without items, and unknown schema', () => {
    expect(
      __internal.generateTypeScriptExample({ oneOf: [{ type: 'string' }, { type: 'number' }] })
    ).toBe('string | number');
    expect(__internal.generateTypeScriptExample({ type: 'array' })).toBe('any[]');
    expect(__internal.generateTypeScriptExample({ foo: 'bar' })).toBe('any');
  });

  test('zodSchemaToString returns undefined when toJSONSchema is not callable', () => {
    expect(__internal.zodSchemaToString({ toJSONSchema: 123 })).toBeUndefined();
  });

  test('zodSchemaToString catches conversion errors', () => {
    const schema = {
      toJSONSchema() {
        throw new Error('boom');
      }
    };
    expect(__internal.zodSchemaToString(schema)).toBeUndefined();
  });
});
