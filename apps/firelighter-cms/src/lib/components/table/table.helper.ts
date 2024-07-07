import type { CellComponent, ColumnDefinition, FilterType } from "tabulator-tables";

export const autoFilter = (operator: FilterType = 'like'): Partial<ColumnDefinition> => {
    return {
        headerFilter: 'list',
        headerFilterParams: {
            valuesLookup: 'active',
            autocomplete: true,
            clearable: true,
            allowEmpty: true,
            listOnEmpty: true,
            freetext: true,
        },
        headerFilterFunc: operator as FilterType,
    };
};

export const autoColumns = <T extends Record<string, unknown>>(data: T[]): ColumnDefinition[] => {
    if (data.length) {
        const total = Object.keys(data[0]).length;
        const column = (key: string) => {
            const def = {
                title: key,
                field: key,
                width: total < 6 ? `${100 / total}%` : '18%',
                editor: 'input',
                resizable: true,
                sorter: 'string',
                ...autoFilter(),
            };
            if (Array.isArray(data[0][key])) {
                def.formatter = arrayFormatter.formatter;
            }
            return def as ColumnDefinition;
        };
        if (total) {
            return Object.keys(data[0]).map(column);
        }
    }
    return [];
};

type CellValue = { type: string | number; value: object; };
const arrayFormatter: Partial<ColumnDefinition> = { 
    formatter(cell: CellComponent): string {
        const value = cell.getValue();
        if (value?.length) {
            if (typeof value[0] === 'string') {
                return value
                    .toString()
                    .split(',')
                    .map((v: unknown) => `<span class='label'>${v}</span>`)
                    .join('');
            } else {
                const pre = 
                    value.map((v: CellValue) => objectMapper[v.type] && objectMapper[v.type](v.value) || JSON.stringify(v))
                    .join('');
                return `<pre>${pre}</pre>`;
            }
        }
        return '';
    },
};

const objectMapper: Record<string, (value: object) => string> = {
    file(value) {
        return `<img src="${value}" />`;
    },
    url(value) {
        return `<img src="${value}" />`;
    },
    text(value) {
        return `${value}`;
    },
    iframe(value) {
        return `${value}`;
    }
}
