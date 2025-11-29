<script lang="ts">
    import { link, params } from "svelte-spa-router";
    import { combineLatest, map, switchMap } from "rxjs";
    import type { Content } from "../lib/models/content.type";
    import { ContentService } from "../lib/stores/db/content.service";
    import { createDocumentStore, createSchemaStore } from "../lib/stores/db/firestore.helper";
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
    const documentStore$ = createDocumentStore<Content>(pathInfo.pipe(map(p => p?.path)));
    const schema$ = combineLatest([
        fromStore(createSchemaStore()), 
        pathInfo
    ]).pipe(
        switchMap(([store, info]) => store.getCollectionFromFullPath(info?.path))
    );
    const contentService$ = combineLatest([
        documentStore$,
        schema$,
        pathInfo
    ]).pipe(map(([store, schema, path]) => new ContentService(store, schema, path?.id)));

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
<List {schema$} {documentStore$}>
    <span slot="commands">
        <a role="button" href="/config/{$pathInfo.schemaPath}" use:link={`/config/${$pathInfo.schemaPath}`} class="icon clear" title="Edit schema">
            <i class="bx bx-wrench"></i>
        </a>
    </span>
</List>

{:else if $pathInfo?.type === 'Document'}
<Details {contentService$} path={`${$pathInfo.path}/${$pathInfo.id}`}>
    <span slot="commands">
        <a role="button" href="/config/{$pathInfo.schemaPath}" use:link={`/config/${$pathInfo.schemaPath}`} class="icon clear" title="Edit schema">
            <i class="bx bx-wrench"></i>
        </a>
    </span>
</Details>

{/if}

