import type { MenuObject, CellComponent, MenuSeparator } from "tabulator-tables";

export type TypedValue = {
    value: string;
    type: 'text';
} | {
    value: object;
    type: string;
};

export interface ColumnOptions<T> {
    idField: string & keyof T;
    maxWidth?: number;
    maxHeight?: number;
    actions?: Array<MenuObject<CellComponent> | MenuSeparator>;
    updateHandler?: (data: T) => void;
}