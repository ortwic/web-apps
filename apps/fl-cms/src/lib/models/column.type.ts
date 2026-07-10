import type { MenuObject, CellComponent, MenuSeparator } from "@web-apps/svelte-tabulator";

export interface ColumnOptions<T> {
    idField: string & keyof T;
    maxWidth?: number;
    maxHeight?: number;
    actions?: Array<MenuObject<CellComponent> | MenuSeparator>;
    updateHandler?: (ids: string[], field: keyof T, value: unknown) => void;
}