<script lang="ts">
    import { onMount } from 'svelte';
    import { derived, get, writable } from 'svelte/store';
    import { querystring } from 'svelte-spa-router';
    import type { AnyProperty, Properties } from '../../lib/packages/firecms_core/types/properties';
    import Expand from '../../lib/components/Expand.svelte';
    import Toolbar from '../../lib/components/Toolbar.svelte';
    import PopupMenu from '../../lib/components/PopupMenu.svelte';
    import type { ContentDocument } from '../../lib/models/content.type';
    import { defaultValueByType } from '../../lib/table/property.helper';
    import { createDocumentStore, createSchemaStore } from '../../lib/stores/firestore.store';
    import { showInfo } from '../../lib/stores/notification.store';
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

    let currentIndex: number | undefined;
    let addSectionMenu: PopupMenu, editSectionMenu: PopupMenu;
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

    function update(document: ContentDocument, content: string, index: number) {
        const section = document.content[index];
        if (section.value !== content) {
            section.value = content;
            $contentStore.setDocuments(document);
            
            showInfo(`Contents of section #${index + 1} [${section.type}] updated.`);
        }
    }

    function showPopupMenu(event: MouseEvent, index: number) {
        currentIndex = index;
        editSectionMenu.showPopupMenu(event);
    }

    function insertSection(type: string, document: ContentDocument) {
        const value = defaultValueByType($contentTypes[type]) as object;
        if (currentIndex !== undefined && currentIndex < document.content.length -1) {
            if (currentIndex < 1) {
                document.content.unshift({ type, value });
            } else {
                const end = document.content.splice(currentIndex + 1);
                document.content.push({ type, value }, ...end);
            }
        } else {
            document.content.push({ type, value });
        }
        $contentStore.setDocuments(document);

        currentIndex = undefined;
    }

    function removeSection(document: ContentDocument) {
        if (currentIndex !== undefined) {
            document.content.splice(currentIndex, 1);
            $contentStore.setDocuments(document);

            currentIndex = undefined;
        }
    }
</script>

<section class="content-64">
    {#if $document}
        <Toolbar>
            <span slot="title">{$document.id}</span>

            <button class="clear" on:click={addSectionMenu.showPopupMenu}>
                <i class="bx bx-plus"></i>
            </button>
        </Toolbar>
        
        {#each $document.content as { type, value }, index}
        <Expand>
            <span slot="header" class="spacer x-flex-full">
                <span></span>
                <span class="small emphasis">{type}</span>
                <button class="clear" on:click={(ev) => showPopupMenu(ev, index)}>⋮</button>
            </span>
            <div class="element">
                {#if typeof value === 'string'}
                    <TextEditor {value} intervalInSecs={10}
                        on:focus={() => currentIndex = index}
                        on:autosave={({ detail }) => update($document, detail, index)}
                        on:blur={({ detail }) => update($document, detail, index)} />
                {:else}
                    <pre>{JSON.stringify(value, null, 2)}</pre>
                {/if}
            </div>
        </Expand>
        {/each}

        <PopupMenu bind:this={editSectionMenu}>
            <div class="small menu no-wrap y-flex">
                <button class="btn" on:click={addSectionMenu.showPopupMenu}>
                    <span class="emphasis"><i class="bx bx-plus"></i> add section</span>
                </button>
                <button class="btn" on:click={() => removeSection($document)}>
                    <span class="emphasis"><i class="bx bx-minus"></i> remove section</span>
                </button>
            </div>
        </PopupMenu>

        <PopupMenu bind:this={addSectionMenu}>
            <div class="small menu y-flex">
                {#each Object.keys($contentTypes) as type}
                    <button class="btn" on:click={() => insertSection(type, $document)}>
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

    .menu {
        background-color: var(--color-bg-2);

        button {
            text-align: left;
        }
    }
</style>
