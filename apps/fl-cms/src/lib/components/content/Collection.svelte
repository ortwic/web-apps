<script lang="ts">
    import yaml from 'js-yaml';
    import { onDestroy } from 'svelte';
    import { readable } from 'svelte/store';
    import { push } from 'svelte-spa-router';
    import { firstValueFrom, map, Observable, of, shareReplay, switchMap, tap } from 'rxjs';
    import { Table, appendColumnSelectorMenu } from '@web-apps/svelte-tabulator';
    import type { CellComponent, TableView } from '@web-apps/svelte-tabulator';
    import { createDefault } from '../../utils/content.helper';
    import type { Entity, Collection } from '../../models/schema.type';
    import { currentClientUser } from '../../stores/app.store';
    import { DocumentStore } from '../../stores/db/document.service';
    import { timestampToIsoDate } from '../../stores/db/firestore.helper';
    import type { DataSource } from '../../stores/data-source.store';
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
    import { toStore } from '../../utils/rx.store';
    
    export let schema$ = of<Collection | null>(null);
    export let documentStore$: Observable<DocumentStore<Entity>>;
    
    // for adding entries
    let showAddEntry = false;
    let newEntryId: string;
    
    // for import data
    let uploadInput: HTMLInputElement;
    let importData: Entity[] | null;
    let importWarnings: string[] | undefined;
    let errorMessage: string | undefined;
    
    // for pagination
    let initialized = false;
    let isLoading = false;
    let total = 0;
    let observer: IntersectionObserver | null = null;
    let appendDataSentinel: HTMLElement;

    $: disabled = !$currentClientUser;

    const ACCEPTED_FORMATS = ['application/json', 'application/yaml', 'application/yml', 'text/yaml', 'text/yml'];
    const PAGE_SIZE = 80;
    const REALTIME_THRESHOLD = PAGE_SIZE * 3;
    
    const dataSource$ = documentStore$.pipe(
        switchMap(async (store): Promise<DataSource<Entity>> => {
            try {
                isLoading = true;
                total = await store.countDocuments();
                return total > REALTIME_THRESHOLD
                    ? { kind: 'paginated', data: store.getPaginatedDocumentsAsync<Entity>(PAGE_SIZE) }
                    : { kind: 'realtime',  data: toStore(store.getDocuments()) };
            } finally {
                isLoading = false;
            }
        }),
        tap(({ kind }) => console.debug(`DataSource: ${kind}`)),
        shareReplay(1)
    );

    $: source = $dataSource$;
    $: documents = source?.kind === 'paginated' ? source.data : source?.data ?? readable([]);

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
    $: if(source?.kind === 'paginated' && initialized && appendDataSentinel) {
        observer?.disconnect();
        observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    source.data.loadNextPage();
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
        if (source) {
            source.data = readable([]);
        }
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

    async function exportDocuments() {
        try {
            const obj = source.kind === 'paginated'
                ? await $documentStore$.getDocumentsAsync()
                : $documents;
            const str = yaml.dump(obj, {
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
        <span class="no-wrap">Σ {$documents?.length}/{total}</span>
        {/if}
    </Toolbar>
</header>

{#await firstValueFrom(schema$)}
<Loading title="schema"/>
{:then schema}
<Loading title="datasource" isLoading={isLoading && !!documents}>
    <section>
        {#if $documents}
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
</Loading>

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
