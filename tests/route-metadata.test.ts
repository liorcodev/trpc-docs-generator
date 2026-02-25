import { describe, test, expect } from 'bun:test';
import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { collectRoutes } from '../src/collect-routes';
import { type RouteMeta } from '../src/types';
import { getRoute } from './_helpers';

const t = initTRPC.meta<RouteMeta>().create();

const router = t.router({
  queryProc: t.procedure
    .meta({
      name: 'Get Item',
      docs: { description: 'Fetches an item', tags: ['items'], auth: true }
    })
    .input(z.object({ id: z.string() }))
    .query(() => ''),
  mutProc: t.procedure.input(z.object({ name: z.string() })).mutation(() => ({ id: 1 })),
  noInput: t.procedure.query(() => 'ok')
});

describe('route metadata', () => {
  test('query procedure has type "query"', () => {
    expect(getRoute(collectRoutes(router), 'queryProc').type).toBe('query');
  });

  test('mutation procedure has type "mutation"', () => {
    expect(getRoute(collectRoutes(router), 'mutProc').type).toBe('mutation');
  });

  test('meta fields are extracted correctly', () => {
    const route = getRoute(collectRoutes(router), 'queryProc');
    expect(route.meta?.name).toBe('Get Item');
    expect(route.meta?.docs?.description).toBe('Fetches an item');
    expect(route.meta?.docs?.tags).toEqual(['items']);
    expect(route.meta?.docs?.auth).toBe(true);
  });

  test('procedure without .meta() has undefined meta', () => {
    expect(getRoute(collectRoutes(router), 'mutProc').meta).toBeUndefined();
  });

  test('procedure without .input() has undefined inputSchema', () => {
    expect(getRoute(collectRoutes(router), 'noInput').inputSchema).toBeUndefined();
  });

  test('procedure without .input() has undefined inputExample', () => {
    expect(getRoute(collectRoutes(router), 'noInput').inputExample).toBeUndefined();
  });

  test('all routes are collected', () => {
    const paths = collectRoutes(router).map(r => r.path);
    expect(paths).toContain('queryProc');
    expect(paths).toContain('mutProc');
    expect(paths).toContain('noInput');
  });
});
