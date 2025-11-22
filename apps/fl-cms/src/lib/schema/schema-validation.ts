import { Ajv, type Schema, type ValidateFunction } from "ajv";
import betterAjvErrors from 'better-ajv-errors';

export function createValidator(schema: Schema): { validate: ValidateFunction, validationErrors: <T>(data: T) => string[] } {
    const ajv = new Ajv({
        allErrors: true,
        strict: false
    });
    
    const validate = ajv.compile(schema);
    return {
        validate,
        validationErrors<T>(data: T, format: 'cli' | 'js' = 'cli') {
            const errors = betterAjvErrors(schema, data, validate.errors, { format });
            return Array.isArray(errors) 
                ? errors.map(e => `${e.error} @${e.start.line}:${e.start.column}\n\t${e.suggestion ?? ''}`).filter(distinct) 
                : errors.split('\n\n').filter(distinct);
        }
    }
}

function distinct<T>(value: T, index: number, array: T[]) {
    return array.indexOf(value) === index;
}