<script lang="ts">
    import json from 'json5';
    import { JSONEditor, Mode } from 'svelte-jsoneditor';
    import type { CellComponent } from 'tabulator-tables';
    import type { EntityCollection } from '$lib/models/schema.model';
    import type { Entity } from '$lib/stores/firestore.store';
    import type { ColumnOptions } from '$lib/components/table/column.type';
    import { createSchemaStore, createStore, timestampReplacer } from '$lib/stores/firestore.store';
    import { prepareColumnDefinitions } from '$lib/components/table/column.helper';
    import Table from '$lib/components/table/Table.svelte';
    import Toolbar from '$lib/components/Toolbar.svelte';
    import { showError, showInfo } from '$lib/stores/notification.store';
    import Modal from '$lib/components/Modal.svelte';
    import CollectionEditor from '../../manage/CollectionEditor.svelte';
    import { goto } from '$app/navigation';
    
    export let data;
    let showAddEntry = false;
    let newEntryId: string;
    let showSettings = false;
    let uploadInput: HTMLInputElement;
    let importJsonData: Entity[] | null;

    const schemaStore = createSchemaStore();
    const currentSchema = $schemaStore.getDocument(data.path);
    const contentStore = createStore(data.path);
    const entities = $contentStore.documents;
    const options: ColumnOptions<Entity> = { 
        idField: 'id',
        maxWidth: 800, 
        maxHeight: 300,
        updateHandler(doc) {
            try {
                if (data.path !== undefined) {
                    return $contentStore.setDocuments(doc).then(() => showInfo(`Updated document ${JSON.stringify(doc)}`));
                }
                showError(`DocumentId is undefined`);
            } catch (error: any) {
                showError(`Failed to update document: ${error?.message}`);
            }
        }
    };
    const editAction = {
        label: '<i class="bx bx-edit"></i> Edit content',
        action: (e: MouseEvent, cell: CellComponent) => {
            const id = cell.getData()['id'];
            goto(`/content/${data.path}/${id}`);
        }
    };
    const deleteAction = {
        label: '<i class="bx bx-trash danger"></i> Delete entry',
        action: (e: MouseEvent, cell: CellComponent) => {
            if (confirm('Are you sure?')) {
                const id = cell.getData()['id'];
                $contentStore.removeDocuments(id)
                    .then(() => showInfo(`Entity ${id} was removed!`));
            }
        }
    };

    function getActions(schema: EntityCollection | null) {
        const actions = [deleteAction];
        if (schema?.properties && 'content' in schema?.properties) {
            actions.unshift(editAction);
        }
        return actions;
    }

    function addEntry() {
        $contentStore.setDocuments({
            id: newEntryId
        });
        showAddEntry = false;
        newEntryId = '';
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
            const jsonStr = JSON.stringify($entities, timestampReplacer, 2); 
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${data.path}.json`; 
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error: any) {
            showError("Failed to download documents:", error.message);
        }
    }
</script>

<svelte:head>
    <title>{data.path}</title>
    <meta name="description" content="Custom Firebase Content Management System" />
</svelte:head>

<header>
    <Toolbar>
        <button title="Import as JSON" class="icon clear" on:click={() => showAddEntry = true}>
            <i class="bx bx-plus"></i>
        </button>
        <button title="Import as JSON" class="icon clear" on:click={selectFile}>
            <i class="bx bx-import"></i>
        </button>
        <button title="Export to JSON" class="icon clear" on:click={exportAsJson}>
            <i class="bx bx-export"></i>
        </button>
        <button title="Settings" class="icon clear" on:click={() => showSettings = true}>
            <i class="bx bx-cog"></i>
        </button>
        <span slot="title">{data.path}</span>
    </Toolbar>
</header>

{#await currentSchema}
<p>Loading...</p>
{:then schema}
<section>
    <Table idField="id" data={entities} persistenceID={data.path}
        columns={prepareColumnDefinitions(schema, {
            ...options,
            actions: getActions(schema)
        })} />
</section>

<Modal open={showAddEntry} width="0" on:close={() => showAddEntry = false}>
    <h2>Enter unique documentId</h2>
    <input id="entry-id" type="text" required placeholder="documentId" pattern="\w+"
        bind:value={newEntryId} on:keydown={(e) => e.key === 'Enter' && addEntry()} />
    <br/>
    <button disabled={!newEntryId} on:click={addEntry}>
        <i class="bx bx-plus"></i>
        Add to collection
    </button>
</Modal>

<Modal open={showSettings} width="100%" on:close={() => showSettings = false}>
    {#if showSettings && schema}
    <CollectionEditor item={schema} />
    {/if}
</Modal>
{/await}

<Modal open={!!importJsonData} width="100%" on:close={() => (importJsonData = null)}>
    {#if importJsonData}
        <JSONEditor mainMenuBar={false} readOnly={true} mode={Mode.text} content={{ json: importJsonData }} />
        <div class="x-flex-full">
            <button class="dialog" on:click={importAsJson}>
                <i class="bx bx-check"></i> Confirm
            </button>
            <button class="dialog" on:click={() => (importJsonData = null)}>
                <i class="bx bx-x"></i> Discard
            </button>
        </div>
        {/if}
</Modal>

<input type="file" bind:this={uploadInput} on:change="{showImportDialog}" accept="application/json" />

<style>
    /* header {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
    } */

    input[type="file"] {
        display: none;
    }

    button.dialog {
        margin-top: .4rem;
        min-width: 33%;
    }
</style>
