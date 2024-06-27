<script lang="ts">
    import json from 'json5';
    import { JSONEditor, Mode } from 'svelte-jsoneditor';
    import type { Document } from '$lib/stores/firestore.store';
    import { createSchemaStore, createStore, timestampReplacer } from '$lib/stores/firestore.store';
    import { prepareColumnDefinitions } from '$lib/components/table/column.helper';
    import Table from '$lib/components/table/Table.svelte';
    import Toolbar from '$lib/components/Toolbar.svelte';
    import { showError } from '$lib/stores/notification.store';
    import Modal from '$lib/components/Modal.svelte';
    
    export let data;
    let uploadInput: HTMLInputElement;
    let importJsonData: Document[] | null;

    const schemaStore = createSchemaStore();
    const currentStore = createStore(data.path);
    const documents = $currentStore.documents;
    const columnPromise = $schemaStore.getDocument(data.path)
        .then(entities => prepareColumnDefinitions(entities, { maxWidth: 800, maxHeight: 300 } ));

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
                importJsonData = json.parse<Document[]>(content);
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
            $currentStore.setDocuments(...importJsonData);
        } catch (error: any) {
            showError("Failed to import documents:", error.message);
        } finally {
            importJsonData = null;
        }
    }

    function exportAsJson() {
        try {
            const jsonStr = JSON.stringify($documents, timestampReplacer, 2); 
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

<Toolbar>
    <button title="Import as JSON" class="icon clear" on:click={selectFile}>
        <i class="bx bx-import"></i>
    </button>
    <button title="Export to JSON" class="icon clear" on:click={exportAsJson}>
        <i class="bx bx-export"></i>
    </button>
    <span slot="title">{data.path}</span>
</Toolbar>

<section>
    {#await columnPromise}
    <p>Loading...</p>
    {:then columns}
    <Table idField="id" {columns} data={documents} persistenceID={data.path} />
    {/await}
</section>

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
    input[type="file"] {
        display: none;
    }

    button.dialog {
        margin-top: .4rem;
        min-width: 33%;
    }
</style>
