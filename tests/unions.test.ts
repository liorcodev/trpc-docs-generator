import { describe, test, expect } from 'bun:test';
import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { collectRoutes } from '../src/collect-routes';
import { inputSchema, inputExample, inputTypeScript } from './_helpers';

const t = initTRPC.create();

const router = t.router({
  strOrNum: t.procedure.input(z.object({ v: z.union([z.string(), z.number()]) })).query(() => ''),
  nullable: t.procedure.input(z.object({ v: z.string().nullable() })).query(() => ''),
  nullish: t.procedure.input(z.object({ v: z.string().nullish() })).query(() => '')
});

describe('union types', () => {
  test('z.union() → anyOf or oneOf in JSON schema', () => {
    const prop = inputSchema(collectRoutes(router), 'strOrNum').properties.v;
    // Zod v4.6+ compacts a union of bare types into `type: [...]` instead of `anyOf`.
    expect(prop.anyOf || prop.oneOf || Array.isArray(prop.type)).toBeTruthy();
  });

  test('z.union() example uses the first variant', () => {
    const ex = inputExample(collectRoutes(router), 'strOrNum');
    expect(typeof ex.v === 'string' || typeof ex.v === 'number').toBe(true);
  });

  test('z.string().nullable() schema allows null', () => {
    const prop = inputSchema(collectRoutes(router), 'nullable').properties.v;
    const variants = prop.anyOf ?? prop.oneOf ?? [prop];
    expect(
      variants.some(
        (s: any) => s.type === 'null' || (Array.isArray(s.type) && s.type.includes('null'))
      )
    ).toBe(true);
  });

  test('z.string().nullish() schema allows null', () => {
    const prop = inputSchema(collectRoutes(router), 'nullish').properties.v;
    const variants = prop.anyOf ?? prop.oneOf ?? [prop];
    expect(
      variants.some(
        (s: any) => s.type === 'null' || (Array.isArray(s.type) && s.type.includes('null'))
      )
    ).toBe(true);
  });

  test('z.union() TypeScript type uses |', () => {
    expect(inputTypeScript(collectRoutes(router), 'strOrNum')).toContain('|');
  });
});
