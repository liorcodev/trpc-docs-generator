import { describe, test, expect } from 'bun:test';
import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { collectRoutes } from '../src/collect-routes';
import { getRoute, inputSchema, inputExample, inputTypeScript } from './_helpers';

const t = initTRPC.create();

const router = t.router({
  create: t.procedure
    .input(
      z.object({
        name: z.string(),
        age: z.number().optional(),
        role: z.string().optional()
      })
    )
    .mutation(() => ({ id: 1 })),

  empty: t.procedure.input(z.object({})).query(() => ''),

  nested: t.procedure
    .input(
      z.object({
        user: z.object({
          id: z.number(),
          address: z.object({ city: z.string() })
        })
      })
    )
    .query(() => '')
});

describe('object – required vs optional fields', () => {
  test('required fields appear in schema.required', () => {
    expect(inputSchema(collectRoutes(router), 'create').required).toContain('name');
  });

  test('optional fields are NOT in schema.required', () => {
    const required = inputSchema(collectRoutes(router), 'create').required ?? [];
    expect(required).not.toContain('age');
    expect(required).not.toContain('role');
  });

  test('required fields appear in the JSON example', () => {
    expect(inputExample(collectRoutes(router), 'create')).toHaveProperty('name');
  });

  test('optional fields do NOT appear in the JSON example', () => {
    const ex = inputExample(collectRoutes(router), 'create');
    expect(ex).not.toHaveProperty('age');
    expect(ex).not.toHaveProperty('role');
  });

  test('optional fields appear in inputOptionalFields', () => {
    const route = getRoute(collectRoutes(router), 'create');
    const names = route.inputOptionalFields?.map(f => f.name) ?? [];
    expect(names).toContain('age');
    expect(names).toContain('role');
  });

  test('optional fields in inputOptionalFields have valid examples', () => {
    const route = getRoute(collectRoutes(router), 'create');
    const ageField = route.inputOptionalFields?.find(f => f.name === 'age');
    expect(ageField).toBeDefined();
    expect(ageField!.example).toBe('0');
  });

  test('empty object → {} example', () => {
    expect(inputExample(collectRoutes(router), 'empty')).toEqual({});
  });

  test('TypeScript type has ? marker for optional fields', () => {
    const ts = inputTypeScript(collectRoutes(router), 'create');
    expect(ts).toMatch(/age\?/);
    expect(ts).toMatch(/role\?/);
  });
});

describe('nested objects', () => {
  test('nested object schema has nested properties', () => {
    const schema = inputSchema(collectRoutes(router), 'nested');
    expect(schema.properties.user.type).toBe('object');
    expect(schema.properties.user.properties.id).toBeDefined();
    expect(schema.properties.user.properties.address.type).toBe('object');
  });

  test('nested object example has correct shape', () => {
    const ex = inputExample(collectRoutes(router), 'nested');
    expect(typeof ex.user).toBe('object');
    expect(ex.user.id).toBe(0);
    expect(typeof ex.user.address).toBe('object');
  });
});
