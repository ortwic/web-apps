<script lang="ts">
    import { link } from "svelte-spa-router";
    import type { Collection } from "../../lib/models/schema.model";
    import Toolbar from "../../lib/components/Toolbar.svelte";
    import { createDocumentStore } from "../../lib/stores/firestore.store";

    export let item: Collection;
    const contentStore = createDocumentStore(item.pathSegments![0]);
    const documents = $contentStore;

    function contentUrl(id: string) {
        return `/list?${item.path.replace(/\//, `/${id}/`)}`;
    }
</script>

<Toolbar>
    <span slot="title">{item.path}</span>
</Toolbar>
<ul>
    {#each $documents as doc}
    <li>
        <a use:link href={contentUrl(doc.id)}>{doc.id}</a>
    </li>
    {/each}
</ul>

<style>
    ul {
        list-style: circle;
    }

    li {
        margin: .5rem 1rem;
    }
</style>