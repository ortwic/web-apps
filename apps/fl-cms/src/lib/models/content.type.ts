export type SectionType = {
    value: ValueType;
    type: string;
    __id?: string | number;
};

export type ValueType = string | number | boolean | object | null;