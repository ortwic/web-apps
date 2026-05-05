<script lang="ts">
    import yaml from 'js-yaml';
    import { push } from 'svelte-spa-router';
    import { firstValueFrom, map, Observable, of, switchMap } from 'rxjs';
    import { Table, appendColumnSelectorMenu } from '@web-apps/svelte-tabulator';
    import type { CellComponent } from '@web-apps/svelte-tabulator';
    import { createDefault } from '../../utils/content.helper';
    import type { Entity, Collection } from '../../models/schema.type';
    import { currentClientUser } from '../../stores/app.store';
    import { DocumentStore } from '../../stores/db/document.service';
    import { timestampToIsoDate } from '../../stores/db/firestore.helper';
    import { showError, showInfo } from '../../stores/notification.store';
    import { prepareColumnDefinitions } from '../../utils/column.helper';
    import Breadcrumb from '../ui/Breadcrumb.svelte';
    import Toolbar from '../ui/Toolbar.svelte';
    import Loading from '../ui/Loading.svelte';
    import Modal from '../ui/Modal.svelte';
    import CodeEditor from '../ui/CodeEditor.svelte';
    import '../../../styles/tabulator.css';
    
    export let schema$ = of<Collection | null>(null);
    export let documentStore$: Observable<DocumentStore<Entity>>;
    
    let showAddEntry = false;
    let newEntryId: string;
    let uploadInput: HTMLInputElement;
    let importData: Entity[] | null;
    let errorMessage: string | undefined;

    $: disabled = !$currentClientUser;

    const documents$ = documentStore$.pipe(switchMap(s => s.getDocuments()));
    const persistenceID$ = documentStore$.pipe(map(s => s.path?.split('/').filter((_, i) => i % 2 === 0).join('_')));
    const columns$ = schema$.pipe(map(s => prepareColumnDefinitions(s, { 
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
                            $documentStore$.removeDocuments(id)
                                .then((ok) => ok ? showInfo(`Entity ${id} was removed!`) : showError(`Unable to remove entity ${id}`));
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
                    push(`/page/${$documentStore$.path}/${id}`);
                }
            }
        ]
    })));

    async function addEntry(schema: Collection | null) {
        const doc = createDefault<Entity>(schema);
        doc.id = newEntryId;
        await $documentStore$.setDocument(doc, true);
        showAddEntry = false;
        newEntryId = '';
    }

    async function update<T extends Entity>(doc: T) {
        try {
            if (await $documentStore$.setDocument(doc, true)) {
                showInfo(`Updated document ${JSON.stringify(doc)}`);
            } else {
                showError(`Unable to update document ${JSON.stringify(doc)}`);
            }
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
                importData = yaml.load(content, { filename: file.name }) as Entity[];
            } catch (error) {
                showError(`Failed to parse file ${file.name}: ${error}`);
            }
        }
    }
    
    async function importDocuments() {
        if (!importData) {
            showError("No data to import");
            return;
        }

        try {
            $documentStore$.setDocuments(...importData);
        } catch (error: any) {
            showError("Failed to import documents:", error.message);
        } finally {
            importData = null;
        }
    }

    function exportDocuments() {
        try {
            const str = yaml.dump($documents$, {
                noArrayIndent: true,
                indent: 2,
                replacer: (k, v) => timestampToIsoDate(v),
            }); 
            const blob = new Blob([str], { type: 'application/x-yaml' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${$documentStore$.path}.yaml`; 
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error: any) {
            showError("Failed to download documents:", error.message);
        }
    }
</script>

<header>
    <Toolbar showNav={true}>
        <button title="Add new entry" {disabled} class="icon clear" on:click={() => showAddEntry = true}>
            <i class="bx bx-plus hl"></i>
        </button>
        <button title="Import from YAML" {disabled} class="icon clear" on:click={selectFile}>
            <i class="bx bx-import"></i>
        </button>
        <button title="Export to YAML" class="icon clear" on:click={exportDocuments}>
            <i class="bx bx-export"></i>
        </button>
        <slot name="commands"></slot>
        <span slot="title">
            <Breadcrumb path={$documentStore$.path ?? ''} rootPath="/page" on:navigate={({ detail: path }) => push(`/${path}`)} />
        </span>
    </Toolbar>
</header>

{#await firstValueFrom(schema$)}
<Loading title="schema"/>
{:then schema}
<section>
    {#if $documents$}
    <!-- on path change columns must be invalidated to keep them in sync -->
    {#key $columns$}
    <Table idField="id" columns={$columns$} data={documents$} persistenceID={$persistenceID$}
        on:init={({ detail }) => appendColumnSelectorMenu(detail)}/>
    {/key}
    {/if}
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

<Modal open={!!importData} width="100%" on:close={() => (importData = null)}>
    {#if importData}
    <Toolbar>
        <span slot="title">Import</span>
        {#if errorMessage}
        <span>{errorMessage}</span>
        {:else}
        <button on:click={importDocuments}>
            <i class="bx bx-check"></i> Confirm
        </button>
        {/if}
    </Toolbar>
    <div class="input">
        <CodeEditor value={importData} on:error={({ detail }) => errorMessage = detail} />
    </div>
    {/if}
</Modal>

<input type="file" bind:this={uploadInput} on:change="{showImportDialog}" 
    accept=".json,.yaml,.yml,application/json,application/x-yaml,text/yaml" />

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
