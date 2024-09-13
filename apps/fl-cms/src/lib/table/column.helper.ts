import { marked } from "marked";
import type { ColumnDefinition, CellComponent, Editor } from "tabulator-tables";
import { autoFilter, label, timestamp } from "@web-apps/svelte-tabulator";
import type { Collection } from "../models/schema.model";
import type { AnyProperty } from "../packages/firecms_core/types/properties";
import type { TypedValue } from "../models/content.type";
import type { ColumnOptions } from "../models/column.model";

function actionColumn<T>(options: ColumnOptions<T>): ColumnDefinition {
    return {
        field: '__actions',
        title: '',
        width: 40,
        headerSort: false,
        clickMenu: options.actions,
        formatter(cell: CellComponent) {
            const element = cell.getElement();
            element.style.cursor = 'pointer';
            return '⋮';
        }
    };
}

export function prepareColumnDefinitions<T>(collection: Collection | null, options: ColumnOptions<T>): ColumnDefinition[] {
    const columns = options.actions ? [actionColumn(options)] : [];
    if (collection?.properties) {
        Object.entries(collection.properties as Record<string, AnyProperty>).forEach(([field, prop]) => {
            const custom = getCustomDefinitionByType(field, prop, options);
            columns.push({
                field,
                title: field,
                resizable: true,
                sorter: 'string',
                maxWidth: options?.maxWidth,
                headerMenu: [],
                headerFilter: 'input',
                ...autoFilter(),
                ...custom
            });
        });
    }
    return columns;
}

function getCustomDefinitionByType<T>(field: string, prop: AnyProperty, options: ColumnOptions<T>): Partial<ColumnDefinition> {
    const maxHeight = options?.maxHeight ? `${options.maxHeight}px` : 'auto';
    const editor = <TValue>(editor: Editor, values?: TValue[]): Partial<ColumnDefinition> => {
        if (!prop.readOnly) {
            return {
                editor,
                editorParams: {
                    values
                },
                cellEdited(cell: CellComponent) {
                    if (options?.updateHandler) {
                        const id = cell.getData()[options.idField];
                        const value = cell.getValue();
                        options.updateHandler({
                            [options.idField]: id, 
                            [field]: value 
                        } as T);
                    }
                }
            };
        }
        return {};
    }

    switch (prop.dataType) {
        case 'boolean':
            return { formatter: 'tickCross', ...editor('tickCross') };

        case 'date':
            return timestamp();
        
        case 'array':
            if ((<AnyProperty>prop.of)?.dataType === 'string') {
                return {
                    ...label(),
                    ...editor('input'),
                };
            }

            return {
                formatter(cell: CellComponent) {
                    const element = cell.getElement();
                    element.classList.add('content-preview');
                    element.style.maxHeight = maxHeight;
                    
                    const array = <TypedValue[]>cell.getValue();
                    return array ? array
                        .filter(v => typeof v?.value === 'string')
                        .map(n => marked(<string>n.value))
                        .join('') : '';
                }
            }
            
        case 'map':
            return {
                formatter(cell: CellComponent) {
                    const element = cell.getElement();
                    element.classList.add('content-preview');
                    element.style.maxHeight = maxHeight;

                    const value = cell.getValue();
                    return getStrings(value);
                }
            };
    
        default:
            if (prop.dataType === 'string' && prop.enumValues) {
                const values = Array.isArray(prop.enumValues) 
                    ? prop.enumValues.map(e => e.id) 
                    : Object.keys(prop.enumValues);
                return {
                    formatter: 'plaintext',
                    ...editor('list', values)
                };
            }

            return { 
                formatter: 'plaintext',
                ...editor('input')
            };
    }
}


function getStrings(value: object): string {
    if (typeof value === 'string') {
        return value;
    } else if (value && typeof value === 'object') {
        return Object.values(value).map(getStrings).join('<br>');
    }
    return '';
};