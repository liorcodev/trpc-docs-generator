import { expect } from 'bun:test';
import { type RouteInfo } from '../src/collect-routes';

export function getRoute(routes: RouteInfo[], path: string): RouteInfo {
  const route = routes.find(r => r.path === path);
  expect(route).toBeDefined();
  return route!;
}

export function inputSchema(routes: RouteInfo[], path: string): any {
  const route = getRoute(routes, path);
  expect(route.inputSchema).toBeDefined();
  return JSON.parse(route.inputSchema!);
}

export function outputSchema(routes: RouteInfo[], path: string): any {
  const route = getRoute(routes, path);
  expect(route.outputSchema).toBeDefined();
  return JSON.parse(route.outputSchema!);
}

export function inputExample(routes: RouteInfo[], path: string): any {
  const route = getRoute(routes, path);
  expect(route.inputExample).toBeDefined();
  return JSON.parse(route.inputExample!);
}

export function inputTypeScript(routes: RouteInfo[], path: string): string {
  const route = getRoute(routes, path);
  expect(route.inputTypeScript).toBeDefined();
  return route.inputTypeScript!;
}
