<script lang="ts">
    import yaml from 'js-yaml';
    import { onDestroy } from 'svelte';
    import { push } from 'svelte-spa-router';
    import { firstValueFrom, map, Observable, of, switchMap } from 'rxjs';
    import { Table, appendColumnSelectorMenu } from '@web-apps/svelte-tabulator';
    import type { CellComponent, Options, TableView } from '@web-apps/svelte-tabulator';
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
    let deleteRowsHandler = () => {};
    
    // for pagination
    let initialized = false;
    let headerEl: HTMLElement;

    $: disabled = !$currentClientUser;

    const INFINITE_SCROLL_THRESHOLD_PX = 400;
    const source$ = createDocumentSource(documentStore$);
    const documents = toStore(source$.pipe(switchMap(s => s)));
    const isLoading = toStore(source$.pipe(switchMap(s => s.isLoading)));
    const hasMore = toStore(source$.pipe(switchMap(s => s.hasMore)));
    const totalCount = toStore(documentStore$.pipe(switchMap(s => s.countDocuments())));
    const options: Options = {
        selectableRows: 'highlight',
        rowHeader: {
            headerSort: false,
            resizable: false,
            frozen: true,
            minWidth: 70,
            formatter: "rowSelection",
            titleFormatter: "rowSelection",
            cellClick(e: MouseEvent, cell: CellComponent) {
                cell.getRow().toggleSelect();
            }
        }
    };

    onDestroy(() => {
        $source$?.destroy();
    });

    const persistenceID$ = documentStore$.pipe(map(s => s.path?.split('/').filter((_, i) => i % 2 === 0).join('_')));
    const columns$ = schema$.pipe(map(s => prepareColumnDefinitions(s, { 
        idField: 'id',
        maxWidth: 800, 
        maxHeight: 300,
        updateHandler: updateEntry, 
        actions: [
            {
                label: '<i class="bx bx-edit"></i>',
                action: (e: MouseEvent, cell: CellComponent) => {
                    const id = cell.getData()['id'];
                    push(`/page/${$documentStore$.path}/${id}`);
                }
            }
        ]
    })));

    /**
     * Sets a fixed height to enable Tabulator's Virtual DOM.
     * - eliminates the IntersectionObserver infinite scroll logic, 
     * - allows native progressive loading via scrollVertical event.
     */
    function fitToViewportHeight(element: HTMLElement) {
        const footer = document.querySelector('footer');
        if (footer) {
            const updateHeight = () => {
                const used = headerEl.clientHeight + footer.clientHeight;
                element.style.height = `calc(100dvh - ${used}px)`;
            };

            const observer = new ResizeObserver(updateHeight);
            observer.observe(headerEl);
            observer.observe(footer);
            updateHeight();

            return {
                destroy() {
                    observer.disconnect();
                }
            }
        }
    }

    function tableInit(view: TableView) {
        appendColumnSelectorMenu(view);
        const holder = view.table.rowManager.element;
        view.table.on('scrollVertical', (top: number) => handleInfiniteScroll(holder, top));
        view.table.on('dataFiltered', () => handleInfiniteScroll(holder, holder.scrollTop));
        deleteRowsHandler = () => {
            const selectedRows = view.table.getSelectedRows();
            const ids = selectedRows.map(row => row.getData()['id']);
            $documentStore$.removeDocuments(...ids)
                .then(() => selectedRows.forEach(row => row.delete()))
                .then(() => showInfo(`Deleted ${ids.length} entries.`));
        };
        initialized = true;
    }

    function handleInfiniteScroll(element: HTMLElement, top: number) {
        if ($hasMore && top + element.clientHeight >= element.scrollHeight - INFINITE_SCROLL_THRESHOLD_PX) {
            $source$.loadNextPage();
        }
    }

    async function addEntry(schema: Collection | null) {
        const doc = createDefault<Entity>(schema);
        doc.id = newEntryId;
        await $documentStore$.setDocument(doc, true);
        showAddEntry = false;
        newEntryId = '';
    }

    async function updateEntry<T extends Entity>(doc: T) {
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
            const { docs } = await $documentStore$.getDocumentsAsync();
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

<header bind:this={headerEl}>
    <Toolbar showNav={true}>
        <button title="Add new entry" {disabled} class="icon clear" on:click={() => showAddEntry = true}>
            <i class="bx bx-plus hl"></i>
        </button>
        <button title="Delete selected rows" {disabled} class="icon clear" on:click={deleteRowsHandler}>
            <i class="bx bx-trash"></i>
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
    <section use:fitToViewportHeight>
        {#if $documents}
        <CollectionImport bind:showSelectFile={showImportDialog} on:confirmed={({ detail }) => importDocuments(detail)}>
            <!-- on path change columns must be invalidated to keep them in sync -->
            {#key $columns$}
            <Table idField="id" columns={$columns$} data={documents} {options} persistenceID={$persistenceID$}
                on:init={({ detail }) => tableInit(detail)} />
            {/key}
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

