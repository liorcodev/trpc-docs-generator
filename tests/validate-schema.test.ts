import { describe, test, expect } from 'bun:test';
import { validateAgainstSchema } from '../src/validate-schema';

describe('validateAgainstSchema', () => {
  test('returns no issues for a matching primitive', () => {
    expect(validateAgainstSchema('hello', { type: 'string' })).toEqual([]);
  });

  test('reports a type mismatch', () => {
    const issues = validateAgainstSchema(42, { type: 'string' });
    expect(issues).toHaveLength(1);
    expect(issues[0]).toContain('expected type string');
  });

  test('accepts integers for a number schema', () => {
    expect(validateAgainstSchema(5, { type: 'number' })).toEqual([]);
  });

  test('reports missing required object fields', () => {
    const schema = {
      type: 'object',
      properties: { id: { type: 'string' }, name: { type: 'string' } },
      required: ['id', 'name']
    };
    const issues = validateAgainstSchema({ id: '1' }, schema);
    expect(issues).toEqual(['$.name: missing required field']);
  });

  test('validates nested object properties', () => {
    const schema = {
      type: 'object',
      properties: { user: { type: 'object', properties: { age: { type: 'number' } } } }
    };
    const issues = validateAgainstSchema({ user: { age: 'old' } }, schema);
    expect(issues).toEqual(['$.user.age: expected type number, got string']);
  });

  test('validates array items', () => {
    const schema = { type: 'array', items: { type: 'string' } };
    const issues = validateAgainstSchema(['a', 1, 'c'], schema);
    expect(issues).toEqual(['$[1]: expected type string, got number']);
  });

  test('validates enum values', () => {
    const schema = { type: 'string', enum: ['admin', 'editor'] };
    expect(validateAgainstSchema('admin', schema)).toEqual([]);
    expect(validateAgainstSchema('viewer', schema)).toHaveLength(1);
  });

  test('validates const values', () => {
    const schema = { const: 'ok' };
    expect(validateAgainstSchema('ok', schema)).toEqual([]);
    expect(validateAgainstSchema('nope', schema)).toHaveLength(1);
  });

  test('validates allOf as an intersection', () => {
    const schema = {
      allOf: [
        { type: 'object', properties: { a: { type: 'string' } }, required: ['a'] },
        { type: 'object', properties: { b: { type: 'number' } }, required: ['b'] }
      ]
    };
    expect(validateAgainstSchema({ a: 'x', b: 1 }, schema)).toEqual([]);
    expect(validateAgainstSchema({ a: 'x' }, schema)).toEqual(['$.b: missing required field']);
  });

  test('validates oneOf/anyOf as a union, passing if any variant matches', () => {
    const schema = { anyOf: [{ type: 'string' }, { type: 'number' }] };
    expect(validateAgainstSchema('hi', schema)).toEqual([]);
    expect(validateAgainstSchema(5, schema)).toEqual([]);
    expect(validateAgainstSchema(true, schema)).toEqual(['$: does not match any allowed variant']);
  });

  test('returns no issues for an unconstrained schema (no type)', () => {
    expect(validateAgainstSchema({ anything: true }, {})).toEqual([]);
  });

  test('returns no issues when schema is missing/invalid', () => {
    expect(validateAgainstSchema('x', undefined)).toEqual([]);
    expect(validateAgainstSchema('x', null)).toEqual([]);
  });
});
