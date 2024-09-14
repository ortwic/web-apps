<script lang="ts">
    import Toolbar from '../../lib/components/Toolbar.svelte';
    import type { TypedValue } from '../../lib/models/content.type.js';
    import { createDocumentStore, type Entity } from '../../lib/stores/firestore.store';
    import { marked } from 'marked';

    export let params: {
        path: string,
        id: string
    };

    type EntityWithContent = Entity & { content: TypedValue[] };

    const contentStore = createDocumentStore<EntityWithContent>(params.path);
    const entityPromise = $contentStore.getDocument(params.id);
</script>

<Toolbar>
    <span slot="title">{params.path} / {params.id}</span>
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