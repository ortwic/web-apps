import type { Entity } from "./schema.model";

export type ContentDocument = Entity & { content: TypedValue[] };
export type TypedValue = {
    value: string | object;
    type: string;
};
