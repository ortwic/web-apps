import type { Entity } from "./schema.model";

export type Content = Entity & { content: Section[] };

type Section = {
    value: string | object;
    type: string;
    id?: string;
};
