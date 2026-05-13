<script lang="ts">
    import yaml from 'js-yaml';
    import { onDestroy } from 'svelte';
    import { push } from 'svelte-spa-router';
    import { firstValueFrom, map, Observable, of, shareReplay } from 'rxjs';
    import { Table, appendColumnSelectorMenu } from '@web-apps/svelte-tabulator';
    import type { CellComponent, TableView } from '@web-apps/svelte-tabulator';
    import { createDefault } from '../../utils/content.helper';
    import type { Entity, Collection } from '../../models/schema.type';
    import { currentClientUser } from '../../stores/app.store';
    import { DocumentStore } from '../../stores/db/document.service';
    import { timestampToIsoDate } from '../../stores/db/firestore.helper';
    import { showError, showInfo } from '../../stores/notification.store';
    import { prepareColumnDefinitions } from '../../utils/column.helper';
    import { parseDocument as parseDocs } from '../../utils/parse-doc.helper';
    import Breadcrumb from '../ui/Breadcrumb.svelte';
    import Toolbar from '../ui/Toolbar.svelte';
    import Loading from '../ui/Loading.svelte';
    import Modal from '../ui/Modal.svelte';
    import DropZone from '../ui/DropZone.svelte';
    import CodeEditor from '../ui/CodeEditor.svelte';
    import '../../../styles/tabulator.css';
    
    export let schema$ = of<Collection | null>(null);
    export let documentStore$: Observable<DocumentStore<Entity>>;
    
    let showAddEntry = false;
    let initialized = false;
    let newEntryId: string;
    let uploadInput: HTMLInputElement;
    let importData: Entity[] | null;
    let importWarnings: string[] | undefined;
    let errorMessage: string | undefined;
    let observer: IntersectionObserver | null = null;
    let appendDataSentinel: HTMLElement;

    $: disabled = !$currentClientUser;

    const ACCEPTED_FORMATS = ['application/json', 'application/yaml', 'application/yml', 'text/yaml', 'text/yml'];
    const PAGE_SIZE = 80;
    
    const dataSource$ = documentStore$.pipe(
        map(s => s.getPaginatedDocumentsAsync(PAGE_SIZE)),
        shareReplay(1)
    );

    $: documents = $dataSource$;

    /**
     * TECH DEBT: Tabulator requires a fixed height to enable its Virtual DOM renderer.
     * Without it, all rows are rendered as real DOM nodes, causing noticeable performance
     * degradation beyond ~250-500 rows. The current infinite scroll approach accumulates
     * all loaded rows in the DOM, making this worse over time.
     *
     * Fix: Set a fixed height on the table (e.g. calc(100vh - headerHeight)).
     * This activates Tabulator's Virtual DOM, eliminates the IntersectionObserver/
     * infinite scroll logic, and allows native progressive loading via scrollVertical event.
     */
    $: if(appendDataSentinel && initialized) {
        observer?.disconnect();
        observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    $dataSource$.loadNextPage();
                }
            },
            { 
                // appends rows when Sentinel is 400px above the bottom of the viewport
                rootMargin: '400px' 
            }
        );
        observer.observe(appendDataSentinel);
    }

    onDestroy(() => {
        observer?.disconnect();
    });

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

    function tableInit(view: TableView) {
        appendColumnSelectorMenu(view);
        initialized = true;
    }

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
    
    async function handleImportClick() {
        if (uploadInput.files?.length) {
            const file = uploadInput.files[0];
            showImportDialog(await file.text(), file);
        }
    }

    function showImportDialog(content: string, file: File) {
        const { doc, warnings, error } = parseDocs<Entity>(content, file.name);
        if (!error) {
            importWarnings = warnings;
            importData = doc;
            return;
        }

        showError(`Failed to parse file ${file.name}: ${error}`);
    }
    
    async function importDocuments() {
        if (!importData?.length) {
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
            const str = yaml.dump($documents, {
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
        {#if documents !== null} 
        Item count: {$documents?.length}
        {/if}
    </Toolbar>
</header>

{#await firstValueFrom(schema$)}
<Loading title="schema"/>
{:then schema}
<section>
    {#if documents && $documents}
    <DropZone on:drop={({ detail: d }) => showImportDialog(d.data, d.file)} accept={ACCEPTED_FORMATS}>
        <!-- on path change columns must be invalidated to keep them in sync -->
        {#key $columns$}
        <Table idField="id" columns={$columns$} data={documents} persistenceID={$persistenceID$}
            on:init={({ detail }) => tableInit(detail)} />
        {/key}
        <div bind:this={appendDataSentinel} style="height: 1px" />
    </DropZone>
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
