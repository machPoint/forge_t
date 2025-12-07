/**
 * Unit tests for the caseConverter utility
 */

const { toCamelCase, toSnakeCase } = require('../../src/utils/caseConverter');

describe('Case Converter Utilities', () => {
  describe('toCamelCase', () => {
    test('converts snake_case object to camelCase', () => {
      const snakeCaseObj = {
        user_id: '123',
        first_name: 'John',
        last_name: 'Doe',
        created_at: '2025-06-23',
        nested_object: {
          object_id: 456,
          object_name: 'Test'
        },
        items_list: [
          { item_id: 1, item_name: 'Item 1' },
          { item_id: 2, item_name: 'Item 2' }
        ]
      };

      const expected = {
        userId: '123',
        firstName: 'John',
        lastName: 'Doe',
        createdAt: '2025-06-23',
        nestedObject: {
          objectId: 456,
          objectName: 'Test'
        },
        itemsList: [
          { itemId: 1, itemName: 'Item 1' },
          { itemId: 2, itemName: 'Item 2' }
        ]
      };

      expect(toCamelCase(snakeCaseObj)).toEqual(expected);
    });

    test('handles null and undefined values', () => {
      expect(toCamelCase(null)).toBeNull();
      expect(toCamelCase(undefined)).toBeUndefined();
    });

    test('handles primitive values', () => {
      expect(toCamelCase('test_string')).toBe('test_string');
      expect(toCamelCase(123)).toBe(123);
      expect(toCamelCase(true)).toBe(true);
    });
  });

  describe('toSnakeCase', () => {
    test('converts camelCase object to snake_case', () => {
      const camelCaseObj = {
        userId: '123',
        firstName: 'John',
        lastName: 'Doe',
        createdAt: '2025-06-23',
        nestedObject: {
          objectId: 456,
          objectName: 'Test'
        },
        itemsList: [
          { itemId: 1, itemName: 'Item 1' },
          { itemId: 2, itemName: 'Item 2' }
        ]
      };

      const expected = {
        user_id: '123',
        first_name: 'John',
        last_name: 'Doe',
        created_at: '2025-06-23',
        nested_object: {
          object_id: 456,
          object_name: 'Test'
        },
        items_list: [
          { item_id: 1, item_name: 'Item 1' },
          { item_id: 2, item_name: 'Item 2' }
        ]
      };

      expect(toSnakeCase(camelCaseObj)).toEqual(expected);
    });

    test('handles null and undefined values', () => {
      expect(toSnakeCase(null)).toBeNull();
      expect(toSnakeCase(undefined)).toBeUndefined();
    });

    test('handles primitive values', () => {
      expect(toSnakeCase('testString')).toBe('testString');
      expect(toSnakeCase(123)).toBe(123);
      expect(toSnakeCase(true)).toBe(true);
    });
  });
});
