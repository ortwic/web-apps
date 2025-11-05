<script lang="ts">
    import { onMount } from 'svelte';
    import { derived, get, writable } from 'svelte/store';
    import { querystring } from 'svelte-spa-router';
    import type { AnyProperty, Properties } from '../../lib/packages/firecms_core/types/properties';
    import Toolbar from '../../lib/components/Toolbar.svelte';
    import PopupMenu from '../../lib/components/PopupMenu.svelte';
    import type { ContentDocument } from '../../lib/models/content.type';
    import { defaultValueByType } from '../../lib/table/property.helper';
    import { createDocumentStore, createSchemaStore } from '../../lib/stores/firestore.store';
    import TextEditor from './TextEditor.svelte';

    const pathInfo = derived(querystring, (path) => {
        const segments = path && path.split('/') || [];
        if (segments.length > 1) {
            if (segments.length % 2 === 0) {
                return {
                    id: segments.pop(),
                    path: segments.join('/'),
                    schema: segments.filter((v, i) => i % 2 === 0)
                };
            }
        }
        return {};
    });
    const contentStore = derived(pathInfo, ({ path }) => get(createDocumentStore<ContentDocument>(path)));
    const documentStore = derived([contentStore, pathInfo], ([contentStore, { id }]) => contentStore.getDocument(id));
    const document = $documentStore;

    let addSectionMenu: PopupMenu;
    let contentTypes = writable<Record<string, AnyProperty>>({});

    onMount(async () => {
        await initContentTypes();
    });

    async function initContentTypes() {
        const path = $pathInfo.schema;
        if (path) {
            const schemaStore = get(createSchemaStore());
            const node = await schemaStore.getNode(...path);
            const contentDescription = (node?.properties as Properties)['content'];
            if (contentDescription && contentDescription.dataType === "array") {
                const types: Record<string, AnyProperty> = {};
                Object.entries(contentDescription.oneOf?.properties ?? {})
                    .forEach(([field, prop]) => {
                        types[field] = prop;
                    });
                contentTypes.set(types);
            }
        }
    }

    function addSection(type: string, document: ContentDocument) {
        const value = defaultValueByType($contentTypes[type]) as object;
        document.content.push({ type, value });
        $contentStore.setDocuments(document);
    }
</script>

<section class="content-64">
    {#if $document}
        <Toolbar>
            <span slot="title">{$document.id}</span>
        </Toolbar>
        
        {#each $document.content as { type, value }}
            <div class="element grid">
                <div class="sidebar">
                    <span class="emphasis">{type}</span>
                </div>

                {#if typeof value === 'string'}
                    <TextEditor {value} />
                {:else}
                    <pre>{JSON.stringify(value, null, 2)}</pre>
                {/if}
            </div>
        {/each}

        <button class="clear" on:click={addSectionMenu.showPopupMenu}>
            <i class="bx bx-plus"></i>
        </button>

        <PopupMenu bind:this={addSectionMenu}>
            <div class="flex-y">
                {#each Object.keys($contentTypes) as type}
                    <button class="btn" on:click={() => addSection(type, $document)}>
                        <span class="emphasis"> {type}</span>
                    </button>
                {/each}
            </div>
        </PopupMenu>
    {:else}
        <Toolbar>
            <span slot="title">Document '{$querystring}' not found</span>
        </Toolbar>
    {/if}
</section>

<style lang="scss">
    .element {
        border: 1px solid transparent;
        transition: all .25s ease-in-out;
    }

    .element:hover {
        border-color: var(--color-theme-1);
        background-color: var(--color-bg-3);
    }

    .grid {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 1rem;

        .sidebar {
            cursor: pointer;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: var(--color-bg-1);
            border: 1px solid var(--color-bg-1);
            width: 3rem;

            span {
                display: block;
                transform: rotate(-90deg);
            }
        }
    }

    .flex-y {
        display: flex;
        flex-direction: column;
        padding: .2em;
        width: 10em;

        button {
            text-align: left;
        }
    }
</style>
