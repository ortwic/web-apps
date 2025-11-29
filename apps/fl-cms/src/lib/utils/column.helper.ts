import { marked } from "marked";
import { autoFilter, label, timestamp } from "@web-apps/svelte-tabulator";
import type { ColumnDefinition, CellComponent, Editor, MenuObject } from "@web-apps/svelte-tabulator";
import type { Collection } from "../models/schema.type";
import type { AnyProperty, BlockSetProperty, MapProperty } from "../packages/firecms_core/types/properties.simple";
import type { ColumnOptions } from "../models/column.type";
import { arrayToSectionMap, isFileType, isImageUrl, isMarkdown } from "./content.helper";
import { currentStorage } from "../stores/storage/storage.service";
import type { SectionType } from "../models/content.type";
import { isRelativeUrl } from "./string.helper";
import { get } from "svelte/store";

export function prepareColumnDefinitions<T>(schema: Collection | null, options: ColumnOptions<T>): ColumnDefinition[] {
    const storage = get(currentStorage);
    const columns = actionColumns(options);
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

    function actionColumns<T>(options: ColumnOptions<T>): ColumnDefinition[] {
        return options.actions?.map((item, i) => {
            const { label, disabled, action, menu } = item as MenuObject<CellComponent>;
            return {
                field: `__action_${i}`,
                title: '',
                headerSort: false,
                clickMenu: menu,
                formatter(cell: CellComponent) {
                    const element = cell.getElement();
                    element.style.padding = '0';
                    element.style.textAlign = 'center';
                    element.style.cursor = 'pointer';

                    if (action) {
                        const button = document.createElement('button');
                        button.classList.add('icon', 'clear');
                        button.disabled = typeof disabled === 'function' ? disabled(cell) : disabled ?? false;
                        button.innerHTML = `${label}`;
                        button.addEventListener('click', (ev) => action(ev, cell));
                        return button;
                    }
                    return `${label}`;
                }
            };
        }) ?? [];
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
                if (prop.of?.dataType === 'string') {
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

                        const map = arrayToSectionMap(cell.getValue() as SectionType[]);
                        return aggregateAsSpan(prop.of, map);
                    }
                }
            
            case 'set':
                return {
                    formatter(cell: CellComponent) {
                        const element = cell.getElement();
                        element.classList.add('content-preview');
                        element.style.maxHeight = maxHeight;

                        const map = arrayToSectionMap(cell.getValue() as SectionType[]);
                        return aggregateAsSpan(prop, map);
                    }
                }
                
            case 'map':
                return {
                    formatter(cell: CellComponent) {
                        const element = cell.getElement();
                        element.classList.add('content-preview');
                        element.style.maxHeight = maxHeight;
                        return aggregateAsSpan(prop, cell.getValue());
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

    function aggregateAsSpan(prop: AnyProperty, value: Record<string, unknown>): HTMLElement {
        return aggregate(prop, value)
            .reduce((acc, e) => {
                acc.appendChild(e);
                return acc;
            }, document.createElement('span'));
    }

    function aggregate(prop: AnyProperty, value: object): HTMLElement[] {
        if (typeof value === 'string' && (isImageUrl(prop) || isFileType(prop, 'image'))) {
            const img = document.createElement('img');
            img.classList.add('preview');
            if (isRelativeUrl(value)) {
                storage.getFileUrl(value)
                    .then(url => img.setAttribute('src', url))
                    .catch(console.warn);
                img.setAttribute('alt', `Resolving path ${value}`);
            } else {
                img.setAttribute('src', value);
                img.setAttribute('alt', prop.name ?? '');
            }
            return [img];
        } else if (typeof value === 'string') {
            const span = document.createElement('span');
            if (isMarkdown(prop)) {
                span.innerHTML = marked(value, { mangle: false, headerIds: false });
            } else {
                span.classList.add('no-wrap');
                span.setAttribute('title', prop?.name ?? '');
                span.innerText = value;
            }
            return [span];
        } else if (value && Array.isArray(value)) {
            return value.flatMap(item => aggregate(prop, item));
        } else if (value && typeof value === 'object') {
            const props = (prop as BlockSetProperty)?.oneOf?.properties 
                ?? (prop as MapProperty)?.properties;
            return Object.entries(value)
                .reduce((acc, [k, v]) => {
                    acc.push(...aggregate(props?.[k] as AnyProperty, v));
                    return acc;
                }, [] as Array<HTMLElement>)
                .filter(Boolean);
        }
        return [];
    };
}
