<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { of } from "rxjs";
    import { Table, Tabulator, type CellComponent, type ColumnDefinition, type TableView } from "@web-apps/svelte-tabulator";
    import type { CMSType } from '../../packages/firecms_core/types/properties.simple';
    import { currentClientUser } from "../../stores/app.store";
    import { arrayToNestedRecord, arrayToRecord, objectToIterableArray } from "../../utils/content.helper";
    import Expand from "../ui/Expand.svelte";

    export let record: Record<string, string | Record<string, string>>;
    export let columns: boolean | string[];
    export let title: string;

    $: disabled = !$currentClientUser;
    
    let addElementButton: HTMLButtonElement;
    const dispatch = createEventDispatcher<{ update: Record<string, CMSType> }>();
    
    const KEY_NAME = 'key';
    const VAL_NAME = 'value';
    const data$ = of(objectToIterableArray(record, Array.isArray(columns) ? columns : VAL_NAME, KEY_NAME));
    const column = (field: string, definition: Partial<ColumnDefinition> = {}): ColumnDefinition => ({ 
        field,
        title: field,
        resizable: true, 
        sorter: 'string',
        ...definition
    });

    function getColumns(): ColumnDefinition[] {
        const valueMap = Array.isArray(columns) ? columns : [VAL_NAME];
        const width = `${72 / valueMap.length}%`;
        return [
            { title: '', field: '', formatter: removeItemElement },
            column(KEY_NAME, {
                editor: 'input',
                editable(cell: CellComponent) {
                    return !cell.getValue();
                }
            }),
            ...valueMap.map(key => column(key, { 
                width,
                editor: 'input',
                editable: (cell) => hasValidKey(cell),
                cellEdited: (cell: CellComponent) => update(cell.getTable())
            }))
        ];
    }

    function hasValidKey(cell: CellComponent): boolean {
        return Boolean(cell.getRow().getData()[KEY_NAME]);
    }

    function init({ table }: TableView) {
        addElementButton.addEventListener('click', () => addElement(table));
    }

    async function addElement(table: Tabulator) {
        const alreadyAdded = table.getData().some(d => !d[KEY_NAME]);
        const row = alreadyAdded ? table.getRows().at(-1)
            : await table.addRow({ [KEY_NAME]: '' });
        setTimeout(() => row?.getCell(KEY_NAME).getElement().focus());
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
        const map = Array.isArray(columns) 
            ? arrayToNestedRecord(data, KEY_NAME, columns)
            : arrayToRecord(data, KEY_NAME, VAL_NAME);
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
        <Table data={data$} columns={getColumns()} idField={KEY_NAME} persistenceID={title}
            on:init={({ detail }) => init(detail)} />
    </div>
</Expand>

<style lang="scss">
</style>