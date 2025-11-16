import { describe, expect, it } from 'vitest';
import './array.extension';

describe('Array extension methods', () => {
  describe('contains', () => {
    it('should return true if the array contains the item', () => {
      const array = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
        { name: 'Charlie', age: 35 },
      ];
      expect(array.contains({ name: 'Bob', age: 25 })).toBe(true);
    });

    it('should return false if the array does not contain the item', () => {
      const array = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
        { name: 'Charlie', age: 35 },
      ];
      expect(array.contains({ name: 'Dave', age: 40 })).toBe(false);
    });
  });

  describe('insert', () => {
    it('should insert the item at the specified index', () => {
      const array = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
        { name: 'Charlie', age: 35 },
      ];
      array.insert({ name: 'Dave', age: 40 }, 1);
      expect(array).toEqual([
        { name: 'Alice', age: 30 },
        { name: 'Dave', age: 40 },
        { name: 'Bob', age: 25 },
        { name: 'Charlie', age: 35 },
      ]);
    });

    it('should insert the item at the beginning if the index is out of range', () => {
      const array = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
        { name: 'Charlie', age: 35 },
      ];
      array.insert({ name: 'Dave', age: 40 }, 4);
      expect(array).toEqual([
        { name: 'Dave', age: 40 },
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
        { name: 'Charlie', age: 35 },
      ]);
    });
  });

  describe('remove', () => {
    it('should remove the item at the specified index', () => {
      const array = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
        { name: 'Charlie', age: 35 },
      ];
      array.remove(1);
      expect(array).toEqual([
        { name: 'Alice', age: 30 },
        { name: 'Charlie', age: 35 },
      ]);
    });

    it('should not remove anything if the index is out of range', () => {
      const array = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
        { name: 'Charlie', age: 35 },
      ];
      array.remove(4);
      expect(array).toEqual([
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
        { name: 'Charlie', age: 35 },
      ]);
    });
  });

  describe('swap', () => {
    it('should swap the item with its previous item if it exists', () => {
      const array = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
        { name: 'Charlie', age: 35 },
      ];
      array.swap(1, 0);
      expect(array).toEqual([
        { name: 'Bob', age: 25 },
        { name: 'Alice', age: 30 },
        { name: 'Charlie', age: 35 },
      ]);
    });

    it('should swap the item with its next item if it exists', () => {
      const array = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
        { name: 'Charlie', age: 35 },
      ];
      array.swap(1, 2);
      expect(array).toEqual([
        { name: 'Alice', age: 30 },
        { name: 'Charlie', age: 35 },
        { name: 'Bob', age: 25 },
      ]);
    });

    it('should swap the first item with the last item', () => {
      const array = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
        { name: 'Charlie', age: 35 },
      ];
      array.swap(0, 2);
      expect(array).toEqual([
        { name: 'Charlie', age: 35 },
        { name: 'Bob', age: 25 },
        { name: 'Alice', age: 30 },
      ]);
    });

    it('should swap the last item with the first item when to index is negative', () => {
      const array = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
        { name: 'Charlie', age: 35 },
      ];
      array.swap(0, -1);
      expect(array).toEqual([
        { name: 'Charlie', age: 35 },
        { name: 'Bob', age: 25 },
        { name: 'Alice', age: 30 },
      ]);
    });

    it('should swap the last item with the first item when from index is negative', () => {
      const array = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
        { name: 'Charlie', age: 35 },
      ];
      array.swap(-1, 0);
      expect(array).toEqual([
        { name: 'Charlie', age: 35 },
        { name: 'Bob', age: 25 },
        { name: 'Alice', age: 30 },
      ]);
    });
  });
});