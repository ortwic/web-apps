<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { Entity } from '../../models/schema.type';
    import { showError } from '../../stores/notification.store';
    import { parseDocument as parseDocs } from '../../utils/parse-doc.helper';
    import CodeEditor from '../ui/CodeEditor.svelte';
    import DropZone from '../ui/DropZone.svelte';
    import Modal from '../ui/Modal.svelte';
    import Toolbar from '../ui/Toolbar.svelte';

    const ACCEPTED_FORMATS = ['application/json', 'application/yaml', 'application/yml', 'text/yaml', 'text/yml'];
    const dispatch = createEventDispatcher<{ confirmed: Entity[] }>();
    
    export function showSelectFile() {
        // ensure onchange fires for same file again
        uploadInput.value = '';
        uploadInput.click();
    }

    let open = false;
    let uploadInput: HTMLInputElement;
    let rawContent = '';
    let fileName = '';
    let idFromKey = 'name';
    let importData: Entity[] | null;
    let importWarnings: string[] | undefined;
    let errorMessage: string | undefined;
    
    async function handleImportClick() {
        if (uploadInput.files?.length) {
            const file = uploadInput.files[0];
            showValidationDialog(await file.text(), file);
        }
    }

    function showValidationDialog(content: string, file: File) {
        open = true;
        rawContent = content;
        fileName = file.name;
        processData();
    }

    function processData() {
        const { doc, warnings, error } = parseDocs<Entity>(rawContent, fileName, idFromKey.split(','));
        if (!error) {
            importWarnings = warnings;
            importData = doc;
            return;
        }

        showError(`Failed to parse file ${fileName}: ${error}`);
    }
    
    async function importDocuments() {
        if (!importData?.length) {
            showError("No data to import");
            return;
        }

        try {
            dispatch('confirmed', importData);
        } catch (error: any) {
            showError("Failed to import documents:", error.message);
        } finally {
            close();
        }
    }

    function close() {
        open = false;
        rawContent = '';
        importData = null;
    }
</script>

<DropZone on:drop={({ detail: d }) => showValidationDialog(d.data, d.file)} accept={ACCEPTED_FORMATS}>
    <slot></slot>
</DropZone>

<Modal {open} width="100%" on:close={close}>
    {#if importData}
    <Toolbar>
        <span slot="title">Import</span>
        {#if errorMessage}
        <span>{errorMessage}</span>
        {:else}
        <button on:click={importDocuments}>
            <i class="bx bx-check"></i> Confirm
        </button>
        <span title="Id from fields (multiple fields separated by comma)">
            <label for="idFromKey">Id from </label>
            <input bind:value={idFromKey} type="text" on:change={processData} />
        </span>
        {/if}
    </Toolbar>
    {#if importWarnings?.length}
        {#each importWarnings as warning}
        <div class="warn">{warning}</div>
        {/each}
    {/if}
    <div class="input">
        <CodeEditor value={importData} on:error={({ detail }) => errorMessage = detail} />
    </div>
    {/if}
</Modal>

<input type="file" bind:this={uploadInput} on:change="{handleImportClick}" 
    accept=".json,.yaml,.yml,{ACCEPTED_FORMATS.join(',')}" />


<style>
    input[type="file"] {
        display: none;
    }

    .input {
        padding: 0;
        height: calc(100% - 3.8rem);
        overflow: auto;
    }

    .warn {
        padding: 1em;
        width: 100%;
        text-align: center;
        color: white;
        background-color: var(--color-theme-2);
    }
</style>