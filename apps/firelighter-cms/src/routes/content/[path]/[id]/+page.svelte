<script lang="ts">
    import Toolbar from '$lib/components/Toolbar.svelte';
    import type { TypedValue } from '$lib/components/table/column.type.js';
    import { createStore, type Entity } from '$lib/stores/firestore.store';
    import { marked } from 'marked';

    export let data;

    type EntityWithContent = Entity & { content: TypedValue[] };

    const contentStore = createStore<EntityWithContent>(data.path);
    const entityPromise = $contentStore.getDocument(data.id);
</script>

<Toolbar>
    <span slot="title">{data.path} / {data.id}</span>
</Toolbar>

{#await entityPromise}
<p>Loading...</p>
{:then entity}
<section class="content-64">
    {#if entity}
        {#each entity.content as { type, value }}
        <div class="element">
            <span class="emphasis">{type}</span>
            {#if typeof value === 'string'}
                {@html marked(value)}
            {:else}
                <pre>{JSON.stringify(value, null, 2)}</pre>
            {/if}
        </div>
        {/each}
    {/if}
</section>
{/await}

<style>
    .element {
        padding: .2rem 1rem;
        border: 1px solid transparent;
        transition: all .2s ease-in-out;
    }

    .element:hover {
        border-color: var(--color-theme-1);
        background-color: var(--color-bg-3);
    }
</style>