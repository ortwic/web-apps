import { Timestamp } from 'firebase/firestore';
import { buildEntityPropertiesFromData, type InferenceTypeBuilder } from '../packages/schema_inference';

export async function buildEntityProperties<T extends {}>(data: T[]) {
    return await buildEntityPropertiesFromData(data, defaultTypeBuilder);
}

export const defaultTypeBuilder: InferenceTypeBuilder = (value: any) => {
    if (typeof value === "number")
        return "number";
    else if (typeof value === "string")
        return "string";
    else if (typeof value === "boolean")
        return "boolean";
    else if (Array.isArray(value))
        return "array";
    else if (value instanceof Timestamp)
        return "date";
    return "map";
};