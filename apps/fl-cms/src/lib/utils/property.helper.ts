import type { Collection } from "../models/schema.model";
import type { AnyProperty, StringProperty } from "../packages/firecms_core/types/properties";

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

export function isImageUrl(prop: AnyProperty): boolean {
    const sp = prop as StringProperty;
    return sp 
        && sp.storage?.storeUrl === true 
        && sp.storage?.acceptedFiles?.includes('image/*') === true;
}

export function isMarkdown(prop: AnyProperty): boolean {
    const sp = prop as StringProperty;
    return sp && sp.markdown === true;
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

export function mergeObject<T>(old: T, value: T) {
    if (Array.isArray(old)) {
        return [
            ...old,
            value
        ];
    } else if (typeof old === 'object') {
        return { ...old, ...value };
    } else {
        return value;
    }
}