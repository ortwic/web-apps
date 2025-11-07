import type { Collection } from "../models/schema.model";
import type { AnyProperty } from "../packages/firecms_core/types/properties";

export function createDefault<T extends Record<string, unknown>>(collection: Pick<Collection, 'properties'> | null) {
    const obj: Record<string, unknown> = { };
    const props = Object.entries(collection?.properties as Record<string, AnyProperty> ?? []);
    props.forEach(([field, prop]) => {
        obj[field] = prop.defaultValue ?? defaultValueByType(prop);
    });
    return obj as T;
}

export function defaultValueByType(prop: AnyProperty): unknown {
    switch (prop.dataType) {
        case 'string':
            return '';
        case 'number':
            return 0;
        case 'boolean':
            return false;
        case 'array':
            return [];
        case 'map':
            return createDefault(prop);
        default:
            return null;
    }
}

export function arrayToMap(property: AnyProperty) {
    if (property && property.dataType === "array") {
        return Object.entries(property.oneOf?.properties ?? {})
            .reduce((acc, [field, prop]) => {
                acc[field] = prop;
                return acc;
            }, {} as Record<string, AnyProperty>);
    }
    return {};
}