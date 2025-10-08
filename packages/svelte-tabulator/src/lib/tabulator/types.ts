import type { CellComponent, Formatter, MenuObject, MenuSeparator, ColumnDefinition as TabulatorColumnDefinition } from 'tabulator-tables';

export interface ColumnDefinition extends TabulatorColumnDefinition {
    groupByFunc?(data: unknown): string;
    clickMenu?: Array<MenuObject<CellComponent> | MenuSeparator> | undefined;
    formatter?: Formatter | undefined;
}