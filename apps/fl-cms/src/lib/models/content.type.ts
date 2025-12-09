import type { CMSType } from "../packages/firecms_core/types/properties.simple";
import type { Entity } from "./schema.type";

export type Content = Entity & { content: SectionType[] };

export type SectionType = {
    value: CMSType | null;
    type: string;
    __id?: string | number;
};
