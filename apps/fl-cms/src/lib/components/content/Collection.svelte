<script lang="ts">
    import json from 'json5';
    import { link, push } from 'svelte-spa-router';
    import { firstValueFrom, map, of, switchMap } from 'rxjs';
    import { Table, appendColumnSelectorMenu } from '@web-apps/svelte-tabulator';
    import type { CellComponent } from '@web-apps/svelte-tabulator';
    import { createDefault } from '../../models/content.helper';
    import type { Entity, Collection } from '../../models/schema.model';
    import { currentClientUser } from '../../stores/app.store';
    import { createDocumentStore, timestampToIsoDate, getCurrentScheme } from '../../stores/db/firestore.store';
    import { prepareColumnDefinitions } from '../../utils/column.helper';
    import Toolbar from '../ui/Toolbar.svelte';
    import Breadcrumb from '../ui/Breadcrumb.svelte';
    import Loading from '../ui/Loading.svelte';
    import Modal from '../ui/Modal.svelte';
    import { showError, showInfo } from '../../stores/notification.store';
    import JSONEditor from '../ui/JSONEditor.svelte';
    import '../../../styles/tabulator.css';
    
    export let path = of('');
    
    let showAddEntry = false;
    let newEntryId: string;
    let uploadInput: HTMLInputElement;
    let importJsonData: Entity[] | null;
    let invalidJsonMessage: string | undefined;

    $: disabled = !$currentClientUser;

    const schemaPath = path.pipe(map(p => p.split('/').filter((s, i) => i % 2 === 0).join('/')));
    const currentSchema = getCurrentScheme(path);
    const contentStore = createDocumentStore(path);
    const documents$ = contentStore.pipe(switchMap(s => s.getDocumentStream<Entity>()));
    const columns$ = currentSchema.pipe(map(s => prepareColumnDefinitions(s, { 
        idField: 'id',
        maxWidth: 800, 
        maxHeight: 300,
        updateHandler: update, 
        actions: [
            {
                disabled,
                label: '<i class="bx bx-trash"></i>',
                menu: [
                    { 
                        label: '<i class="bx bx-check"></i> Confirm', 
                        action: (e: MouseEvent, cell: CellComponent) => {
                            const id = cell.getData()['id'];
                            $contentStore.removeDocuments(id)
                                .then(() => showInfo(`Entity ${id} was removed!`));
                        } 
                    },
                    {
                        label: '<i class="bx bx-x"></i> Cancel'
                    }
                ]
            },
            {
                disabled,
                label: '<i class="bx bx-edit"></i>',
                action: (e: MouseEvent, cell: CellComponent) => {
                    const id = cell.getData()['id'];
                    push(`/page/${$path}/${id}`);
                }
            }
        ]
    })));
    
    $: columns = $columns$;

    async function addEntry(schema: Collection | null) {
        const document = createDefault<Entity>(schema);
        document.id = newEntryId;
        await $contentStore.setDocuments(document);
        showAddEntry = false;
        newEntryId = '';
    }

    function update<T extends Entity>(doc: T) {
        try {
            if ($path !== undefined) {
                return $contentStore.setDocuments(doc)
                    .then(() => showInfo(`Updated document ${JSON.stringify(doc)}`));
            }
            showError(`DocumentId is undefined`);
        } catch (error: any) {
            showError(`Failed to update document: ${error?.message}`);
        }
    }

    function selectFile() {
        // ensure onchange fires for same file again
        uploadInput.value = '';
        uploadInput.click();
    }
    
    async function showImportDialog() {
        if (uploadInput.files?.length) {
            const file = uploadInput.files[0];
            const content = await file.text();
            try {            
                importJsonData = json.parse<Entity[]>(content);
            } catch (error) {
                showError("Unable to parse JSON file");
            }
        }
    }
    
    async function importAsJson() {
        if (!importJsonData) {
            showError("No data to import");
            return;
        }

        try {
            $contentStore.setDocuments(...importJsonData);
        } catch (error: any) {
            showError("Failed to import documents:", error.message);
        } finally {
            importJsonData = null;
        }
    }

    function exportAsJson() {
        try {
            const jsonStr = JSON.stringify($documents$, (k, v) => timestampToIsoDate(v), 2); 
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${$path}.json`; 
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error: any) {
            showError("Failed to download documents:", error.message);
        }
    }
</script>

<header>
    <Toolbar>
        <button title="Back" disabled={!history.length} class="icon clear" on:click={() => history.back()}>
            <i class="bx bx-arrow-back"></i>
        </button>
        <button title="Add new entry" {disabled} class="icon clear" on:click={() => showAddEntry = true}>
            <i class="bx bx-plus hl"></i>
        </button>
        <button title="Import as JSON" {disabled} class="icon clear" on:click={selectFile}>
            <i class="bx bx-import"></i>
        </button>
        <button title="Export to JSON" class="icon clear" on:click={exportAsJson}>
            <i class="bx bx-export"></i>
        </button>
        <a role="button" href="/config/{$path}" use:link={`/config/${$schemaPath}`} class="icon clear" title="Edit schema">
            <i class="bx bx-code-curly"></i>
        </a>
        <span slot="title">
            <Breadcrumb {path} rootPath="/page" on:navigate={({ detail: path }) => push(`/${path}`)} />
        </span>
    </Toolbar>
</header>

{#await firstValueFrom(currentSchema)}
<Loading />
{:then schema}
<section>
    <!-- on path change columns must be invalidated to keep them in sync -->
    {#key $path}
    <Table idField="id" data={documents$} persistenceID={$path} {columns}
        on:init={({ detail }) => appendColumnSelectorMenu(detail)}/>
    {/key}
</section>

<Modal open={showAddEntry} width="0" on:close={() => showAddEntry = false}>
    <p>Enter unique id for {schema?.name}</p>
    <input id="entry-id" type="text" required placeholder="documentId" pattern="\w+"
        bind:value={newEntryId} on:keydown={(e) => e.key === 'Enter' && addEntry(schema)} />
    <br/>
    <button disabled={!newEntryId} on:click={() => addEntry(schema)}>
        <i class="bx bx-plus"></i>
        Add to collection
    </button>
</Modal>
{/await}

<Modal open={!!importJsonData} width="100%" on:close={() => (importJsonData = null)}>
    {#if importJsonData}
    <Toolbar>
        <span slot="title">Import JSON</span>
        {#if invalidJsonMessage}
        <span>{invalidJsonMessage}</span>
        {:else}
        <button on:click={importAsJson}>
            <i class="bx bx-check"></i> Confirm
        </button>
        {/if}
    </Toolbar>
    <div class="input">
        <JSONEditor value={importJsonData} on:error={({ detail }) => invalidJsonMessage = detail} />
    </div>
    {/if}
</Modal>

<input type="file" bind:this={uploadInput} on:change="{showImportDialog}" accept="application/json" />

<style>
    input[type="file"] {
        display: none;
    }

    .input {
        padding: 0;
        height: calc(100% - 3.8rem);
        overflow: auto;
    }
</style>
