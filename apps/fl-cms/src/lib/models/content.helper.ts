import type { Collection } from "./schema.model";
import type { AnyProperty, ArrayProperty, UrlProperty, MapProperty, StringProperty, FileProperty, PreviewType, DataType, BlockSetProperty } from "../packages/firecms_core/types/properties.simple";
import type { SectionType, ValueType } from "./content.type";

export function createDefault<T extends Record<string, unknown>>(collection: Pick<Collection, 'properties'> | null) {
    const obj: Record<string, unknown> = { };
    const props = Object.entries(collection?.properties as Record<string, AnyProperty> ?? []);
    props.forEach(([field, prop]) => {
        obj[field] = prop.defaultValue ?? defaultValueByType(prop);
    });
    return obj as T;
}

export function defaultValueByType(property: AnyProperty): ValueType {
    switch (property.dataType) {
        case 'string':
            return '';
        case 'number':
            return 0;
        case 'boolean':
            return false;
        case 'array':
            return [];
        case 'map':
            return createDefault(property);
        default:
            return null;
    }
}

export function isFileType(property: AnyProperty, preview?: PreviewType): property is FileProperty {
    const prop = property as FileProperty;
    return prop && prop?.storage !== undefined && prop?.preview === preview;
}

export function isImageUrl(property: AnyProperty): property is UrlProperty {
    const prop = property as UrlProperty;
    return prop && prop?.url === 'image';
}

export function isMarkdown(property: AnyProperty): property is StringProperty {
    const prop = property as StringProperty;
    return prop && prop.markdown === true;
}

export function isArrayProperty(property: AnyProperty, type?: DataType): property is ArrayProperty {
    const prop = property as ArrayProperty;
    if (property.dataType === 'array') {
        return type ? prop?.of?.dataType === type : prop?.of !== undefined;
    }
    return false;
}

export const isMapProperty = (prop?: AnyProperty): prop is MapProperty => prop?.dataType === "map";

export const isBlockSetProperty = (prop?: AnyProperty): prop is BlockSetProperty => prop?.dataType === "set";

export function arrayPropertyToMapProperty<T extends AnyProperty>(
    property: AnyProperty, 
    typeGuard?: (prop: AnyProperty) => prop is T
): Record<string, T> {
    if (property && property.dataType === "set" && property.oneOf?.properties) {
        return Object.entries(property.oneOf.properties)
            .filter((t): t is [string, T] => typeGuard ? typeGuard(t[1]) : true)
            .reduce((acc, [field, prop]) => {
                acc[field] = prop;
                return acc;
            }, {} as Record<string, T>);
    }
    return {};
}

export function arrayToSectionMap(array?: SectionType[]): Record<string, unknown> {
    const result = {} as Record<string, unknown>;
    return array ? array
        .filter(item => typeof item?.value === 'string')
        .reduce((acc, { type, value }: SectionType) => {
            acc[type] = value;
            return acc;
        }, result) : result;
}

export function mergeObject<T>(old: T, value: T) {
    if (typeof old === 'object' && !Array.isArray(old)) {
        return { ...old, ...value };
    } else {
        return value;
    }
}