import type { Collection } from "../models/schema.type";
import type { AnyProperty, ArrayProperty, UrlProperty, MapProperty, StringProperty, FileProperty, PreviewType, DataType, BlockSetProperty, CMSType } from "../packages/firecms_core/types/properties.simple";
import type { SectionType } from "../models/content.type";

export function createDefault<T extends Record<string, unknown>>(collection: Pick<Collection, 'properties'> | null) {
    const obj: Record<string, unknown> = { };
    const props = Object.entries(collection?.properties as Record<string, AnyProperty> ?? []);
    props.forEach(([field, prop]) => {
        obj[field] = prop.defaultValue ?? defaultValueByType(prop);
    });
    return obj as T;
}

export function defaultValueByType(property: AnyProperty): CMSType | null {
    switch (property.dataType) {
        case 'string':
        case 'file':
        case 'url':
            return '';
        case 'number':
            return 0;
        case 'date':
            return property.autoValue ? new Date() : null;
        case 'boolean':
            return false;
        case 'array':
        case 'set':
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

export function isMarkdown(property: AnyProperty): property is StringProperty {
    const prop = property as StringProperty;
    return prop && prop.markdown === true;
}

export function isUrlProperty(property: AnyProperty, type?: PreviewType): property is UrlProperty {
    const prop = property as UrlProperty;
    return prop?.url && type ? prop?.url === type : prop?.url !== undefined;
}

export function isArrayProperty(property: AnyProperty, type?: DataType): property is ArrayProperty {
    const prop = property as ArrayProperty;
    if (property.dataType === 'array') {
        return type ? prop?.of?.dataType === type : prop?.of !== undefined;
    }
    return false;
}

export const isMapProperty = (prop?: AnyProperty): prop is MapProperty => prop?.dataType === "map";

export const isBlockSetProperty = (prop?: AnyProperty): prop is BlockSetProperty => prop?.dataType === "set" 
    // backward compatibility to FireCMS
    || prop?.dataType === "array" && (prop as any)?.oneOf !== undefined;

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

export const arrayToSectionMap = (array: SectionType[] | undefined): Record<string, CMSType | null> => 
    arrayToRecord(array?.filter(item => typeof item['value'] === 'string'), 'type', 'value');

export function arrayToRecord<
    T extends Record<K, string> & Record<V, T[V]>,
    K extends keyof T & string, 
    V extends keyof T & string
>(array: T[] | undefined, keyName: K, valName: V): Record<string, T[V]> {
    const result: Record<string, T[V]> = {};
    return array ? array.reduce((acc, { [keyName]: key, [valName]: value }: T) => {
        acc[key] = value;
        return acc;
    }, result) : result;
}

export function objectToIterableArray(record: Record<string, CMSType>, keyName = 'key'): Array<{}> {
    return record ? Object.entries(record).reduce((acc, [field, value]) => {
        acc.push({ [keyName]: field, type: typeOf(value), value });
        return acc;
    }, [] as Array<{}>) : [];
}

function typeOf<T>(value: T): string {
    const type = typeof value;
    return Array.isArray(value) ? 'array' : type;
}

export function mergeObject<T>(old: T, value: T) {
    if (typeof old === 'object' && !Array.isArray(old)) {
        return { ...old, ...value };
    } else {
        return value;
    }
}