<script lang='ts'>
    import { derived, readable, type Readable } from 'svelte/store';
    import type { ColumnDefinition } from 'tabulator-tables';
    import { Table, autoColumns } from '@web-apps/svelte-tabulator';
    import FileDrop from './FileDrop.svelte';
    import ConfirmDialog from '../dialogs/ConfirmDialog.svelte';
    import TabbedTitle from '../ui/TabbedTitle.svelte';
    import stores, { type WithId } from '../../service/master-data.service';
    import { uniqueKey } from '../../service/firestore.service';
    import { showInfo, showError } from '../../store/notification.store';
    import { observableToStore } from '../../store/app.store';

    
    type Pages = keyof typeof stores;
    let active: Pages;
    let columns: Readable<ColumnDefinition[]>;
    let data: Readable<WithId[]>;
    let sub: { unsubscribe: () => void; };

    async function changePage(path: Pages) {
        const page = stores[path];
        active = path;
        sub?.unsubscribe();
        data = observableToStore(page.docs());
        columns = derived(data, (values) => autoColumns(values));
    }

    async function importJSON(event: CustomEvent): Promise<void> {
        try {
            const json = JSON.parse(event.detail);
            if (json?.length && active === 'Genres') {
                const field = Object.keys(json[0])[0];
                if (field) {
                    columns = readable(autoColumns(json));
                    const dataWithId = json.map(obj => ({ id: uniqueKey(obj[field]), ...obj }));
                    data = readable(dataWithId);
                    await stores[active].update(dataWithId);

                    showInfo(`Found ${json.length} entries.`);
                }
            } else {
                showInfo(`${active} not supported!`);
            }
        } catch (error) {
            showError(error.message);
        }
    }

    function done({ detail }) {
        active = undefined;

        if (detail) {
            showInfo('Done');
        }
    }
</script>
           
<div class="row">    
    <button class='edit' title='Edit master data' on:click={() => changePage('Feedback')}>
        <i class='bx bxs-edit'></i> <slot></slot>
    </button>
</div>

{#if active}
<ConfirmDialog target='main' size='max' on:closed={done}>
    <span slot="title">
        <TabbedTitle tabs={Object.keys(stores)} {active} on:tabChange={({ detail }) => changePage(detail)} />
    </span>
    <FileDrop on:enter={() => showInfo('Start importing...')} on:addJson={importJSON}>
        {#if $columns?.length}
        <Table {data} columns={$columns} groupBy={stores[active].groupBy} idField='id'/>
        {:else}
        <div class='placeholder'>Drop json-file here to import data</div>
        {/if}
    </FileDrop>
</ConfirmDialog>
{/if}


<style lang="scss">
    div.placeholder {
        width: 100%;
        height: 100%;
        transform: translate(50%, 50%);
    }

    button.edit {
        padding: 0;
        outline: 0;
        border: inherit;
        box-shadow: inherit;
        // cursor: inherit;
        // color: inherit;
        // background-color: inherit;
        // font-weight: inherit;
        // text-shadow: inherit;
    }
</style>