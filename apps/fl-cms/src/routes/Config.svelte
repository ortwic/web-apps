<script lang="ts">
    import { params } from "svelte-spa-router";
    import { combineLatest, map, of, switchMap } from "rxjs";
    import { ContentService } from "../lib/stores/db/content.service";
    import { createSchemaStore } from "../lib/stores/db/firestore.helper";
    import { fromStore } from "../lib/utils/rx.store";
    import type { Collection } from "../lib/models/schema.type";
    import { ConfigAdapter, schema } from "../lib/stores/db/config-document.adapter";
    import type { SchemaStore } from "../lib/stores/db/schema.service";
    import CollectionEditor from "../lib/components/schema/CollectionEditor.svelte";
    import Document from "../lib/components/content/Document.svelte";

    const schemaStore$ = fromStore(createSchemaStore(undefined, '__schematest'));
    const schema$ = combineLatest([schemaStore$, fromStore(params)])
        .pipe(switchMap(([store, p]) => p?.wild ? store.getCollectionFromSchemaPath(...p?.wild.split('/')) : of(null)));

    const contentService$ = combineLatest([
        schemaStore$,
        fromStore(params)
    ]).pipe(map(([store, p]) => createContentService(store, p?.wild)));
    
    let showJsonView = false;

    function createContentService(store: SchemaStore, path?: string) {
        const adapter = new ConfigAdapter(store);
        return new ContentService(adapter, schema(), path);
    }

    function toggleEditView() {
        showJsonView = !showJsonView;
    }
</script>

<svelte:head>
    <title>Firebase CMS | Config</title>
</svelte:head>

{#if $schema$}
    {#if showJsonView}
        {#key $schema$.path}
        <CollectionEditor item={$schema$}>
            <span slot="commands">
                <button title="Toggle code view" class="icon clear" on:click={toggleEditView}>
                    <i class="bx {showJsonView ? 'bx-list-ul' : 'bx-code-curly'}"></i>
                </button>
            </span>
        </CollectionEditor>
        {/key}
    {:else}
        <Document {contentService$} path={$schema$.path} rootPath="/config">
            <span slot="commands">
                <button title="Toggle code view" class="icon clear" on:click={toggleEditView}>
                    <i class="bx {showJsonView ? 'bx-list-ul' : 'bx-code-curly'}"></i>
                </button>
            </span>
        </Document>
    {/if}
{:else}
<p>Config for schema with schematic path '{$params?.wild}' not found</p>
{/if}