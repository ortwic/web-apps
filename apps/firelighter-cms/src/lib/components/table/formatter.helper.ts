import { Timestamp } from 'firebase/firestore';
import type { CellComponent, ColumnDefinition } from 'tabulator-tables';
import { DateTime } from 'luxon';

export function image(): Partial<ColumnDefinition> { 
    return {
        formatter(cell: CellComponent) {
            const url = cell.getValue();
            const element = cell.getElement();
            element.classList.add('image');
            if (url) {
                element.style.backgroundImage = `url(${url})`;
            } else {
                element.classList.add('default');
            }
            return '&nbsp;';
        }
    }; 
};

export function url(): Partial<ColumnDefinition> { 
    return {
        formatter(cell: CellComponent) {
            const resource = cell.getValue();
            if (resource) {
                const a = document.createElement('a');
                a.setAttribute('href', resource);
                a.setAttribute('target', '_blank');
                try {
                    const url = new URL(resource);
                    a.text = `${url.hostname}${url.pathname}${url.search ?? url.hash}`;
                } catch (error) {
                    a.text = resource;
                }
                return a;
            }
        }
    } as Partial<ColumnDefinition>;
};

export function length(): Partial<ColumnDefinition> { 
    return {
        formatter: (cell: CellComponent): string => cell.getValue()?.length,
        formatterParams: { hideTitle: true }
    }; 
};

export function label(): Partial<ColumnDefinition> { 
    return {
        formatter(cell: CellComponent) {
            const element = cell.getElement();
            element.style.whiteSpace = 'normal';
            element.style.lineHeight = '150%';

            const value = cell.getValue();
            if (value?.length) {
                return value
                    .toString()
                    .split(',')
                    .map((v: unknown) => `<span class='label'>${v}</span> `)
                    .join('');
            }
        },
    } as Partial<ColumnDefinition>; 
};

export function timestamp(): Partial<ColumnDefinition> { 
    return {
        formatter(cell: CellComponent): string {
            const value = cell.getValue();
            if (value instanceof Timestamp) {
                return DateTime.fromJSDate(value.toDate()).toFormat('yyyy-MM-dd HH:mm:ss');
            }
            if (value?.seconds) {
                return DateTime.fromSeconds(value.seconds).toFormat('yyyy-MM-dd HH:mm:ss');
            }
            return `${value}`;
        },
    }; 
};


