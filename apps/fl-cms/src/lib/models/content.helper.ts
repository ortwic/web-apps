import type { Collection } from "./schema.model";
import type { AnyProperty, ArrayProperty, MapProperty, StringProperty } from "../packages/firecms_core/types/properties";
import type { ValueType } from "./content.type";

export function createDefault<T extends Record<string, unknown>>(collection: Pick<Collection, 'properties'> | null) {
    const obj: Record<string, unknown> = { };
    const props = Object.entries(collection?.properties as Record<string, AnyProperty> ?? []);
    props.forEach(([field, prop]) => {
        obj[field] = prop.defaultValue ?? defaultValueByType(prop);
    });
    return obj as T;
}

export function defaultValueByType(prop: AnyProperty): ValueType {
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

export const isMapProperty = (prop: AnyProperty): prop is MapProperty => prop?.dataType === "map";
export const isArrayProperty = (prop: AnyProperty): prop is ArrayProperty => prop?.dataType === "array";
export function arrayToMap<T extends AnyProperty>(
    property: AnyProperty, 
    typeGuard?: (prop: AnyProperty) => prop is T
): Record<string, T> {
    if (property && property.dataType === "array" && property.oneOf?.properties) {
        return Object.entries(property.oneOf.properties)
            .filter((t): t is [string, T] => typeGuard ? typeGuard(t[1]) : true)
            .reduce((acc, [field, prop]) => {
                acc[field] = prop;
                return acc;
            }, {} as Record<string, T>);
    }
    return {};
}

export function mergeObject<T>(old: T, value: T) {
    if (typeof old === 'object' && !Array.isArray(old)) {
        return { ...old, ...value };
    } else {
        return value;
    }
}