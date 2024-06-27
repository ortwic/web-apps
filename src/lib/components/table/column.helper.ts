import type { ColumnDefinition, CellComponent } from "tabulator-tables";
import type { EntityCollection } from "$lib/models/schema.model";
import type { AnyProperty } from "$lib/packages/firecms_core/types/properties";
import { autoFilter } from "./table.helper";
import { label, timestamp } from "./formatter.helper";
import { marked } from "marked";

type TypedValue = {
    value: string | object;
    type: 'text' | string;
}

export function prepareColumnDefinitions(collection: EntityCollection | null, settings?: {
    maxWidth?: number
    maxHeight?: number,
}): ColumnDefinition[] {

    const maxHeight = settings?.maxHeight ? `${settings.maxHeight}px` : 'auto';
    const columns = [] as ColumnDefinition[];
    if (collection?.properties) {
        Object.entries(collection.properties).forEach(([field, prop]) => {
            const custom = getCustomDefinitionByType(prop, maxHeight);
            columns.push({
                field,
                title: field,
                resizable: true,
                sorter: 'string',
                maxWidth: settings?.maxWidth,
                headerMenu: [],
                headerFilter: 'input',
                ...autoFilter(),
                ...custom
            });
        });
    }
    return columns;
}

function getCustomDefinitionByType(prop: AnyProperty, maxHeight: string): Partial<ColumnDefinition> {
    switch (prop.dataType) {
        case 'boolean':
            return { formatter: 'tickCross' };

        case 'date':
            return timestamp();
        
        case 'array':
            if ((<AnyProperty>prop.of)?.dataType === 'string') {
                return {
                    ...label(),
                    editor: 'input',
                };
            }

            return {
                formatter(cell: CellComponent) {
                    const element = cell.getElement();
                    element.classList.add('content-preview');
                    element.style.maxHeight = maxHeight;
                    
                    const array = <TypedValue[]>cell.getValue();
                    return array
                        .filter(v => typeof v?.value === 'string')
                        .map(n => marked(<string>n.value))
                        .join('');
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
            return { 
                formatter: 'plaintext',
                editor: !prop.readOnly ? 'input' : undefined
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