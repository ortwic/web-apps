<script lang="ts">
    import { link } from "svelte-spa-router";
    import { derived } from "svelte/store";
    import type { Collection } from "../../models/schema.model";
    import Modal from "../ui/Modal.svelte";
    import Toolbar from "../ui/Toolbar.svelte";
    import { createDocumentStore } from "../../stores/db/firestore.helper";

    export let item: Collection;
    export let path: string;
    let lastSelectedId = '';
    let contentStore = createDocumentStore(path);
    const navigation = derived($contentStore, documents => documents.map(d => navigationInfo(d.id)));

    function navigationInfo(id: string) {
        const segments = item.pathSegments || item.path.split('/');
        const current = segments.indexOf(path.split('/').pop()!) + 1;
        return {
            id,
            nested: segments.length > current + 1,
            path: `${path}/${id}/${segments[current]}`
        };
    }

</script>

<Toolbar>
    <span slot="title" class="no-wrap">{path}</span>
</Toolbar>
<ul>
    {#each $navigation as nav}
    {#if nav.nested}
    <li>
        <!-- svelte-ignore a11y-interactive-supports-focus -->
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-missing-attribute -->
        <a role="button" on:click|preventDefault={() => lastSelectedId = nav.id} class="pointer">
            {nav.id}
        </a>
        <Modal open={lastSelectedId === nav.id} width="{nav.path.length + 4}em" on:close={() => (lastSelectedId = '')}>
            {#if lastSelectedId === nav.id}
            <svelte:self {item} path={nav.path} />
            {/if}
        </Modal>
    </li>
    {:else}
    <li>
        <a role="button" use:link href='/page/{nav.path}'>
            {nav.id}
        </a>
    </li>
    {/if}
    {/each}
</ul>

<style>
    ul {
        list-style: none;
    }

    li {
        margin: .5rem 1rem;
    }
</style>