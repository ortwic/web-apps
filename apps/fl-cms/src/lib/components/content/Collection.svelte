<script lang="ts">
    import yaml from 'js-yaml';
    import { onDestroy } from 'svelte';
    import { push } from 'svelte-spa-router';
    import { firstValueFrom, map, Observable, of, switchMap } from 'rxjs';
    import { Table, appendColumnSelectorMenu } from '@web-apps/svelte-tabulator';
    import type { CellComponent, TableView } from '@web-apps/svelte-tabulator';
    import { createDefault } from '../../utils/content.helper';
    import type { Entity, Collection } from '../../models/schema.type';
    import { currentClientUser } from '../../stores/app.store';
    import { DocumentStore } from '../../stores/db/document.service';
    import { timestampToIsoDate } from '../../stores/db/firestore.helper';
    import { createDocumentSource } from '../../stores/data-source.store';
    import { showError, showInfo } from '../../stores/notification.store';
    import { prepareColumnDefinitions } from '../../utils/column.helper';
    import Breadcrumb from '../ui/Breadcrumb.svelte';
    import Toolbar from '../ui/Toolbar.svelte';
    import Loading from '../ui/Loading.svelte';
    import Modal from '../ui/Modal.svelte';
    import '../../../styles/tabulator.css';
    import CollectionImport from './CollectionImport.svelte';
    import { toStore } from '../../utils/rx.store';
    
    export let schema$ = of<Collection | null>(null);
    export let documentStore$: Observable<DocumentStore<Entity>>;

    // for adding entries
    let showAddEntry = false;
    let newEntryId: string;

    let showImportDialog = () => {};
    
    // for pagination
    let initialized = false;
    let observer: IntersectionObserver | null = null;
    let appendDataSentinel: HTMLElement;

    $: disabled = !$currentClientUser;

    const source$ = createDocumentSource(documentStore$);
    const documents = toStore(source$.pipe(switchMap(s => s)));
    const isLoading = toStore(source$.pipe(switchMap(s => s.isLoading)));
    const hasMore = toStore(source$.pipe(switchMap(s => s.hasMore)));
    const totalCount = toStore(documentStore$.pipe(switchMap(s => s.countDocuments())));

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
    $: if($hasMore && initialized && appendDataSentinel) {
        observer?.disconnect();
        observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    $source$.loadNextPage();
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
        $source$.destroy();
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

    function importDocuments(importData: Entity[]) {
        $documentStore$.setDocuments(...importData);
    }

    async function exportDocuments() {
        try {
            const docs = await firstValueFrom($documentStore$.getDocuments());
            const str = yaml.dump(docs, {
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
        <button title="Import from YAML" {disabled} class="icon clear" on:click={showImportDialog}>
            <i class="bx bx-import"></i>
        </button>
        <button title="Export to YAML" class="icon clear" on:click={exportDocuments}>
            <i class="bx bx-export"></i>
        </button>
        <slot name="commands"></slot>
        <span slot="title">
            <Breadcrumb path={$documentStore$.path ?? ''} rootPath="/page" on:navigate={({ detail: path }) => push(`/${path}`)} />
        </span>
        <span class="no-wrap">
            Σ {$documents?.length ?? ''}/{$totalCount ?? ''}
        </span>
    </Toolbar>
</header>

{#await firstValueFrom(schema$)}
<Loading title="schema"/>
{:then schema}
<Loading title="datasource" isLoading={$isLoading} overlay={initialized}>
    <section>
        {#if $documents}
        <CollectionImport bind:showSelectFile={showImportDialog} on:confirmed={({ detail }) => importDocuments(detail)}>
            <!-- on path change columns must be invalidated to keep them in sync -->
            {#key $columns$}
            <Table idField="id" columns={$columns$} data={documents} persistenceID={$persistenceID$}
                on:init={({ detail }) => tableInit(detail)} />
            {/key}
            <div bind:this={appendDataSentinel} style="height: 1px" />
        </CollectionImport>
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

