import type { Entity } from "./schema.type";

export type Content = Entity & { content: SectionType[] };

export type SectionType = {
    value: ValueType;
    type: string;
    __id?: string | number;
};

export type ValueType = string | number | boolean | object | null;