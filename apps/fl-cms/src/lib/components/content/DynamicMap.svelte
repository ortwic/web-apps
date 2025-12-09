<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { of } from "rxjs";
    import { Table, Tabulator, type CellComponent, type ColumnDefinition, type TableView } from "@web-apps/svelte-tabulator";
    import type { CMSType } from '../../packages/firecms_core/types/properties.simple';
    import { currentClientUser } from "../../stores/app.store";
    import { arrayToRecord, objectToIterableArray } from "../../utils/content.helper";
    import Expand from "../ui/Expand.svelte";

    export let record: Record<string, CMSType>;
    export let title: string;

    $: disabled = !$currentClientUser;
    
    let addElementButton: HTMLButtonElement;
    const dispatch = createEventDispatcher<{ update: Record<string, CMSType> }>();
    
    const keyName = 'key';
    const valName = 'value';
    const typeName = 'type';
    const data$ = of(objectToIterableArray(record, keyName));
    const column = (field: string, title?: string, definition: Partial<ColumnDefinition> = {}): ColumnDefinition => ({ 
        field,
        title: title ?? field,
        resizable: true, 
        sorter: 'string',
        ...definition
    });

    const columns: ColumnDefinition[] = [
        { title: '', field: '', formatter: removeItemElement },
        column(keyName, 'Key', {
            editor: 'input',
            editable(cell: CellComponent) {
                return !cell.getValue();
            }
        }),
        column(typeName, 'Type', {
            visible: false,
            editor: 'list',
            editable: (cell) => !hasValue(cell),
            editorParams: {
                values: ['object', 'array', 'string', 'number', 'boolean']
            }
        }),
        column(valName, 'Value', {
            width: '60%',
            editor: 'input',
            editable: (cell) => hasValidKey(cell) && typeof cell.getValue() !== 'object',
            cellEdited: (cell: CellComponent) => update(cell.getTable()),
            formatter(cell: CellComponent) {
                const value = cell.getValue();
                if (Array.isArray(value)) {
                    return (value as []).join(',');
                }
                if (typeof value === 'object') {
                    return `<pre>${JSON.stringify(value, null, 2)}</pre>`;
                } 
                return `<span style='white-space:pre-wrap'>${value}</span>`;
            }
        }),
    ];

    function hasValidKey(cell: CellComponent): boolean {
        return Boolean(cell.getRow().getData()[keyName]);
    }

    function hasValue(cell: CellComponent): boolean {
        return Boolean(cell.getRow().getData()[valName]);
    }

    function init({ table }: TableView) {
        addElementButton.addEventListener('click', () => addElement(table));
    }

    async function addElement(table: Tabulator) {
        const alreadyAdded = table.getData().some(d => !d[keyName]);
        const row = alreadyAdded ? table.getRows().at(-1)
            : await table.addRow({ [keyName]: '', [valName]: '', [typeName]: 'string' });
        setTimeout(() => row?.getCell(keyName).getElement().focus());
    }

    function removeItemElement(cell: CellComponent) {
        const div = document.createElement('div');
        const button = document.createElement('button');
        button.classList.add('icon', 'clear');
        button.innerHTML = `<i class="bx bx-trash"></i>`;
        button.addEventListener('click', () => {
            cell.getRow().delete();
            update(cell.getTable());
        });
        
        div.appendChild(button);

        const value = cell.getValue();
        if (value) {
            const span = document.createElement('span');
            span.innerText = cell.getValue();
            div.appendChild(span);
        }
        return div;
    }

    function update(table: Tabulator) {
        const data = table.getData();
        const map = arrayToRecord(data, keyName, valName);
        dispatch('update', map);
    }

</script>

<Expand>
    <span slot="header" class="x-flex-full">
        <span class="emphasis no-wrap center">{title}</span>
        <button bind:this={addElementButton} class="icon clear" {disabled} title="Add element">
            <i class="bx bx-plus"></i>
        </button>
    </span>
    <div class="input">
        <Table data={data$} {columns} idField={keyName} persistenceID={title}
            on:init={({ detail }) => init(detail)} />
    </div>
</Expand>

<style lang="scss">
</style>