import { describe, expect, it } from "vitest";
import { createValidator } from "./schema-validation";
import schema from './generated/property-record.schema.json';
import { templates } from "./predefined-collections";

describe('schema validation tests', () => {
    const fromTemplate = (key: string) => templates[key].properties;

    it('should throw validation error on unknown dataType', () => {
        const { validate, validationErrors } = createValidator(schema);
        const data = {
            foo: { dataType: 'text' }
        };
        expect(validate(data)).toBeFalsy();

        const result = validationErrors(data).filter(Boolean);
        expect(result.length).toBeTruthy();
        // expect(result[0]).toEqual('dataType must be one of "string", "number", "date", "boolean", "map", "array"');
    });

    it('should validate list properties from template without errors', () => {
        const { validationErrors } = createValidator(schema);
        const data = fromTemplate('list');

        const result = validationErrors(data).filter(Boolean);
        expect(result).toEqual([]);
    });

    it('should validate blog properties from template without errors', () => {
        const { validationErrors } = createValidator(schema);
        const data = fromTemplate('blog');

        const result = validationErrors(data).filter(Boolean);
        expect(result).toEqual([]);
    });

    it('should validate page properties from template without errors', () => {
        const { validationErrors } = createValidator(schema);
        const data = fromTemplate('page');
        
        const result = validationErrors(data).filter(Boolean);
        expect(result).toEqual([]);
    });
});