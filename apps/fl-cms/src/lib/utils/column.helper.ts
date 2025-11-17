import { marked } from "marked";
import { autoFilter, label, timestamp } from "@web-apps/svelte-tabulator";
import type { ColumnDefinition, CellComponent, Editor } from "@web-apps/svelte-tabulator";
import type { Collection } from "../models/schema.model";
import type { AnyProperty, MapProperty } from "../packages/firecms_core/types/properties";
import type { ColumnOptions } from "../models/column.model";
import { isImageUrl, isMarkdown } from "../models/content.helper";

export function prepareColumnDefinitions<T>(schema: Collection | null, options: ColumnOptions<T>): ColumnDefinition[] {
    const columns = options.actions ? [actionColumn(options)] : [];
    return Object.entries(schema?.properties as Record<string, AnyProperty> ?? [])
        .reduce((acc, [field, prop]) => {
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
            return acc;
        }, columns);
}

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
                    
                    const array = <{ value: unknown }[]>cell.getValue();
                    return array ? array
                        .filter(item => typeof item?.value === 'string')
                        .map(n => marked(<string>n.value, { mangle: false, headerIds: false }))
                        .join('') : '';
                }
            }
            
        case 'map':
            return {
                formatter(cell: CellComponent) {
                    const element = cell.getElement();
                    element.classList.add('content-preview');
                    element.style.maxHeight = maxHeight;
                    return aggregate(prop, cell.getValue());
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


function aggregate(prop: AnyProperty, value: object): string {
    if (isImageUrl(prop)) {
        return value ? `<img src="${value}" alt="${prop.name}" class="preview" />` : '';
    } else if (typeof value === 'string') {
        return isMarkdown(prop) 
            ? marked(value, { mangle: false, headerIds: false }) 
            : `<span title="${prop?.name}" class="no-wrap">${value}</span>`;
    } else if (value && typeof value === 'object') {
        return Object.entries(value)
            .reduce((acc, [k, v]) => {
                const p = (prop as MapProperty)?.properties?.[k];
                acc.push(aggregate(p as AnyProperty, v));
                return acc;
            }, [] as string[])
            .filter(Boolean)
            .join('<br>');
    }
    return '';
};

