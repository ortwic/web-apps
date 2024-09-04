/* eslint-disable @typescript-eslint/no-explicit-any */
import type { DataType } from "../firecms_core/types/properties";

export type TypesCount = {
    number?: number,
    string?: number,
    boolean?: number,
    map?: TypesCountRecord,
    array?: TypesCount,
    date?: number,
    geopoint?: number,
    reference?: number
};

export type TypesCountRecord<K extends keyof DataType = any> = {
    [P in K]: TypesCount
};

export type ValuesCountEntry = {
    values: any[];
    valuesCount: Map<any, number>;
    mapValues?: ValuesCountRecord;
};

export type ValuesCountRecord = Record<string, ValuesCountEntry>;

export type InferencePropertyBuilderProps = {

    /**
     * Name of the property
     */
    name: string;

    /**
     * Total documents this props are built from
     */
    totalDocsCount: number;

    /**
     * How many times does each value show up
     */
    valuesResult?: ValuesCountEntry;
};
