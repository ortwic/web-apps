import { describe, it, expect } from 'vitest';
import { arrayToRecord, arrayToNestedRecord, objectToIterableArray } from './content.helper';

describe('arrayToRecord', () => {
    it('should convert array to simple key-value record', () => {
        const input = [
            { key: 'name', value: 'John' },
            { key: 'age', value: '30' }
        ];
        
        const result = arrayToRecord(input, 'key', 'value');
        
        expect(result).toEqual({
            name: 'John',
            age: '30'
        });
    });

    it('should return empty object when array is undefined', () => {
        type TestRecord = { key: string; value: string };
        const result = arrayToRecord<TestRecord, 'key', 'value'>(undefined, 'key', 'value');
        
        expect(result).toEqual({});
    });

    it('should handle empty array', () => {
        const result = arrayToRecord([], 'key', 'value');
        
        expect(result).toEqual({});
    });

    it('should overwrite duplicate keys with last value', () => {
        const input = [
            { key: 'name', value: 'John' },
            { key: 'name', value: 'Jane' }
        ];
        
        const result = arrayToRecord(input, 'key', 'value');
        
        expect(result).toEqual({
            name: 'Jane'
        });
    });
});

describe('arrayToNestedRecord', () => {
    it('should convert array to nested multilingual record', () => {
        const input = [
            { key: 'feed', de: 'Blog', en: 'Blog' },
            { key: 'home', de: 'Start', en: 'Home' }
        ];
        
        const result = arrayToNestedRecord(input, 'key', ['de', 'en']);
        
        expect(result).toEqual({
            feed: { de: 'Blog', en: 'Blog' },
            home: { de: 'Start', en: 'Home' }
        });
    });

    it('should return empty object when array is undefined', () => {
        const result = arrayToNestedRecord(undefined, 'key', ['de', 'en']);
        
        expect(result).toEqual({});
    });

    it('should handle empty array', () => {
        const result = arrayToNestedRecord([], 'key', ['de', 'en']);
        
        expect(result).toEqual({});
    });

    it('should handle single language column', () => {
        const input = [
            { key: 'title', de: 'Titel' }
        ];
        
        const result = arrayToNestedRecord(input, 'key', ['de']);
        
        expect(result).toEqual({
            title: { de: 'Titel' }
        });
    });

    it('should handle multiple language columns', () => {
        const input = [
            { key: 'greeting', de: 'Hallo', en: 'Hello', es: 'Hola', fr: 'Bonjour' }
        ];
        
        const result = arrayToNestedRecord(input, 'key', ['de', 'en', 'es', 'fr']);
        
        expect(result).toEqual({
            greeting: { de: 'Hallo', en: 'Hello', es: 'Hola', fr: 'Bonjour' }
        });
    });

    it('should overwrite duplicate keys with last value', () => {
        const input = [
            { key: 'name', de: 'Eins', en: 'One' },
            { key: 'name', de: 'Zwei', en: 'Two' }
        ];
        
        const result = arrayToNestedRecord(input, 'key', ['de', 'en']);
        
        expect(result).toEqual({
            name: { de: 'Zwei', en: 'Two' }
        });
    });
});

describe('objectToIterableArray', () => {
    describe('with multilingual records (columns as array)', () => {
        it('should convert nested record to flat array', () => {
            const input = {
                feed: { de: 'Blog', en: 'Blog' },
                home: { de: 'Start', en: 'Home' }
            };
            
            const result = objectToIterableArray(input, ['de', 'en'], 'key');
            
            expect(result).toEqual([
                { key: 'feed', de: 'Blog', en: 'Blog' },
                { key: 'home', de: 'Start', en: 'Home' }
            ]);
        });

        it('should use custom key name', () => {
            const input = {
                title: { de: 'Titel', en: 'Title' }
            };
            
            const result = objectToIterableArray(input, ['de', 'en'], 'id');
            
            expect(result).toEqual([
                { id: 'title', de: 'Titel', en: 'Title' }
            ]);
        });

        it('should handle single language', () => {
            const input = {
                greeting: { de: 'Hallo' }
            };
            
            const result = objectToIterableArray(input, ['de'], 'key');
            
            expect(result).toEqual([
                { key: 'greeting', de: 'Hallo' }
            ]);
        });
    });

    describe('with simple string records (columns as string)', () => {
        it('should convert simple record to array', () => {
            const input = {
                name: 'John',
                age: '30'
            };
            
            const result = objectToIterableArray(input, 'value', 'key');
            
            expect(result).toEqual([
                { key: 'name', value: 'John' },
                { key: 'age', value: '30' }
            ]);
        });

        it('should use custom column name', () => {
            const input = {
                title: 'Hello'
            };
            
            const result = objectToIterableArray(input, 'text', 'key');
            
            expect(result).toEqual([
                { key: 'title', text: 'Hello' }
            ]);
        });
    });

    describe('edge cases', () => {
        it('should return empty array for undefined record', () => {
            const result = objectToIterableArray(undefined as any, 'value', 'key');
            
            expect(result).toEqual([]);
        });

        it('should return empty array for null record', () => {
            const result = objectToIterableArray(null as any, 'value', 'key');
            
            expect(result).toEqual([]);
        });

        it('should handle empty record', () => {
            const result = objectToIterableArray({}, ['de', 'en'], 'key');
            
            expect(result).toEqual([]);
        });

        it('should throw error when columns array does not match object value type', () => {
            const input = {
                simple: 'value'
            };
            
            expect(() => {
                objectToIterableArray(input, ['de', 'en'], 'key');
            }).toThrow('Column parameter does not match with record');
        });
    });

    describe('round-trip conversion', () => {
        it('should maintain data integrity through conversion cycle (multilingual)', () => {
            const original = {
                feed: { de: 'Blog', en: 'Blog' },
                home: { de: 'Start', en: 'Home' }
            };
            
            const array = objectToIterableArray(original, ['de', 'en'], 'key');
            const result = arrayToNestedRecord(array as any, 'key', ['de', 'en']);
            
            expect(result).toEqual(original);
        });

        it('should maintain data integrity through conversion cycle (simple)', () => {
            const original = {
                name: 'John',
                age: '30'
            };
            
            const array = objectToIterableArray(original, 'value', 'key');
            const result = arrayToRecord(array as any, 'key', 'value');
            
            expect(result).toEqual(original);
        });
    });
});