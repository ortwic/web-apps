<script lang="ts">
    import { get } from 'svelte/store';
    import { querystring } from 'svelte-spa-router';
    import { marked } from 'marked';
    import Toolbar from '../../lib/components/Toolbar.svelte';
    import type { ContentDocument } from '../../lib/models/content.type';
    import { createDocumentStore } from '../../lib/stores/firestore.store';

    function getDocument(path: string) {
        const segments = path.split('/');
        if (segments.length > 1) {
            const documentId = segments.pop();
            const store = createDocumentStore<ContentDocument>(segments.join('/'));
            return get(store).getDocument(documentId);
        }
    }
</script>

{#await getDocument($querystring ?? '')}
<Toolbar>
    <span slot="title">Loading ...</span>
</Toolbar>
{:then document}
<section class="content-64">
    {#if document}
        <Toolbar>
            <span slot="title">{document.id}</span>
        </Toolbar>
        {#each document.content as { type, value }}
        <div class="element">
            <span class="emphasis">{type}</span>
            {#if typeof value === 'string'}
                {@html marked(value)}
            {:else}
                <pre>{JSON.stringify(value, null, 2)}</pre>
            {/if}
        </div>
        {/each}
    {:else}
        <Toolbar>
            <span slot="title">Document '{$querystring}' not found</span>
        </Toolbar>
    {/if}
</section>
{/await}

<style>
    .element {
        padding: .2rem 1rem;
        border: 1px solid transparent;
        transition: all .25s ease-in-out;
    }

    .element:hover {
        border-color: var(--color-theme-1);
        background-color: var(--color-bg-3);
    }
</style>