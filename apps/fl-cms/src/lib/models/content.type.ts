import type { Entity } from "./schema.model";

export type Content = Entity & { content: Section[] };

type Section = {
    value: ValueType;
    type: string;
    id?: string;
};

export type ValueType = string | number | boolean | object | null;