import { writable } from "svelte/store";
import type { ColumnDefinition, Tabulator } from 'tabulator-tables';

export interface TableView {
    table: Tabulator;
    columns: ColumnDefinition[];
    groups: string[];
    toggleGroup(field: string, element?: HTMLElement): void;
    useResponsiveLayout: boolean;
}

export const tableView = writable<TableView>();
