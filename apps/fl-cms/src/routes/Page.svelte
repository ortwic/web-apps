<script lang="ts">
    import { link, params } from "svelte-spa-router";
    import { combineLatest, map, switchMap } from "rxjs";
    import { createDocumentStore, createSchemaStore } from "../lib/stores/db/firestore.store";
    import { fromStore } from "../lib/utils/rx.store";
    import List from "../lib/components/content/Collection.svelte";
    import Details from "../lib/components/content/Document.svelte";

    type PathInfo = {
        type: 'Collection' | 'Document';
        schemaPath: string;
        path: string;
        id?: string;
    };

    const pathInfo = fromStore(params).pipe(map((p) => parsePath(p?.wild)));
    const contentStore = createDocumentStore(pathInfo.pipe(map(p => p?.path)));
    const contentSchema = combineLatest([
        fromStore(createSchemaStore()), 
        pathInfo
    ]).pipe(
        switchMap(([store, info]) => store.getCollectionFromFullPath(info?.path))
    );

    function parsePath(wild: string | undefined): PathInfo | undefined {
        const segments = wild?.split('/') || [];
        if (wild && segments.length > 0) {
            const schemaPath = segments.filter((_, i) => i % 2 === 0).join('/');
            if (segments.length % 2 !== 0) {
                return {
                    type: 'Collection',
                    schemaPath,
                    path: wild,
                }
            }
            return {
                type: 'Document',
                schemaPath,
                id: segments.pop(),
                path: segments.join('/')
            };
        }
    }
</script>

<svelte:head>
    <title>Firebase CMS | {$pathInfo?.type}</title>
</svelte:head>

{#if $pathInfo?.type === 'Collection'}
<List {contentSchema} {contentStore}>
    <span slot="commands">
        <a role="button" href="/config/{$pathInfo.schemaPath}" use:link={`/config/${$pathInfo.schemaPath}`} class="icon clear" title="Edit schema">
            <i class="bx bx-wrench"></i>
        </a>
    </span>
</List>

{:else if $pathInfo?.type === 'Document'}
<Details {contentSchema} {contentStore} contentKey="content" id={pathInfo.pipe(map(p => p?.id ?? ''))}>
    <span slot="commands">
        <a role="button" href="/config/{$pathInfo.schemaPath}" use:link={`/config/${$pathInfo.schemaPath}`} class="icon clear" title="Edit schema">
            <i class="bx bx-wrench"></i>
        </a>
    </span>
</Details>

{/if}

