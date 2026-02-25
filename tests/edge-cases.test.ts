import { describe, test, expect } from 'bun:test';
import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { collectRoutes } from '../src/collect-routes';
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
});
