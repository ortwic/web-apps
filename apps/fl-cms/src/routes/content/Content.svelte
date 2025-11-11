<script lang="ts">
    import json from 'json5';
    import { flip } from 'svelte/animate';
    import { derived, get } from 'svelte/store';
    import { link, querystring } from 'svelte-spa-router';
    import { nanoid } from 'nanoid';
    import { map, startWith } from 'rxjs';
    import { colorScheme } from '@web-apps/svelte-tabulator';
    import type { AnyProperty, MapProperty, Properties } from '../../lib/packages/firecms_core/types/properties';
    import Expand from '../../lib/components/Expand.svelte';
    import Toolbar from '../../lib/components/Toolbar.svelte';
    import PopupMenu from '../../lib/components/PopupMenu.svelte';
    import type { ContentDocument } from '../../lib/models/content.type';
    import { currentClientUser } from '../../lib/stores/app.store';
    import { arrayToMap, defaultValueByType, isMapProperty, isMarkdown, mergeObject } from '../../lib/utils/property.helper';
    import { createDocumentStore, getCurrentScheme } from '../../lib/stores/db/firestore.store';
    import { showError, showInfo } from '../../lib/stores/notification.store';
    import MarkdownEditor from '../../lib/components/MarkdownEditor.svelte';
    import PropertyEditor from './PropertyEditor.svelte';
    import { JSONEditor, Mode, type Content } from 'svelte-jsoneditor';

    $: disabled = !$currentClientUser;

    const pathInfo = derived(querystring, (path) => {
        const segments = path && path.split('/') || [];
        if (segments.length > 1) {
            if (segments.length % 2 === 0) {
                return {
                    id: segments.pop(),
                    path: segments.join('/')
                };
            }
        }
        return {};
    });
    const contentStore = derived(pathInfo, ({ path }) => get(createDocumentStore<ContentDocument>(path)));
    const documentStore = derived([contentStore, pathInfo], ([contentStore, { id }]) => contentStore.getDocument(id));
    const document = $documentStore;

    const currentSchema = getCurrentScheme(querystring);
    const properties = currentSchema.pipe(
        map(schema => Object.entries(schema?.properties as Properties ?? [])
            .filter(([field]) => field !== 'content')
            .reduce((acc, [field, prop]) => {
                acc[field] = prop;
                return acc;
            }, {} as Record<string, AnyProperty>)
        )
    );
    const contentTypes = currentSchema.pipe(
        map(schema => arrayToMap((schema?.properties as Properties)['content'])),
        startWith({} as Record<string, AnyProperty>)
    );
    const contentMapTypes = currentSchema.pipe(
        map(schema => arrayToMap((schema?.properties as Properties)['content'], isMapProperty)),
        startWith({} as Record<string, MapProperty>)
    );

    let currentIndex: number | undefined;
    let addSectionMenu: PopupMenu, editSectionMenu: PopupMenu;

    function contentProperties(type: string)  {
        return $contentMapTypes[type]?.properties as Record<string, AnyProperty>;
    }

    function showPopupMenu(event: MouseEvent, index?: number) {
        if (index !== undefined) {
            currentIndex = index;
            editSectionMenu.showPopupMenu(event);
        } else {
            addSectionMenu.showPopupMenu(event);
        }
    }

    async function updateProperty(document: ContentDocument, obj: Record<string, unknown>) {
        Object.entries(obj).forEach(([field, value]) => document[field] = value);
        await $contentStore.setDocuments(document);
    }

    function insertSection(type: string, document: ContentDocument) {
        const value = defaultValueByType($contentTypes[type]) as object;
        if (currentIndex !== undefined && currentIndex < document.content.length) {
            document.content.splice(currentIndex + 1, 0, { type, value, id: nanoid() });
        } else {
            document.content.unshift({ type, value, id: nanoid() });
        }
        $contentStore.setDocuments(document);

        currentIndex = undefined;
    }

    function moveUp(document: ContentDocument, index: number) {
        if (index > 0) {
            const section = document.content[index];
            document.content.splice(index, 1);
            document.content.splice(index - 1, 0, section);
            $contentStore.setDocuments(document);
        }
    }

    function moveDown(document: ContentDocument, index: number) {
        if (index < document.content.length - 1) {
            const section = document.content[index];
            document.content.splice(index, 1);
            document.content.splice(index + 1, 0, section);
            $contentStore.setDocuments(document);
        }
    }

    async function updateJson(document: ContentDocument, content: Content, index: number) {
        if ('text' in content) {
            try {   
                const value = json.parse(content.text);
                await updateSection(document, value, index);
            } catch (error) {
                showError(`Invalid JSON: ${error}`);
            }
        }
    }

    async function updateSection(document: ContentDocument, value: object, index: number) {
        const section = document.content[index];
        if (section.value !== value) {
            section.value = mergeObject(section.value, value);
            console.log({ [index]: section.value })
            await $contentStore.setDocuments(document);
            
            showInfo(`Contents of section #${index + 1} [${section.type}] updated.`);
        }
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
            <span slot="title"><a use:link href="/manage">{$document.id}</a></span>
        </Toolbar>

        <Expand open={false}>
            <span slot="header" class="center x-flex-full">
                <span></span>
                <span class="clear small emphasis">Details of {$currentSchema?.name}</span>
                <div class="commands">
                    <button class="icon clear" {disabled} title="Add section"
                        on:click={addSectionMenu.showPopupMenu}>
                        <i class="bx bx-plus"></i>
                    </button>
                </div>
            </span>
            <div class="section">
                <PropertyEditor document={$document} properties={$properties} 
                    on:update={({ detail }) => updateProperty($document, detail)}/>
            </div>
        </Expand>
        
        {#each $document.content as { type, value, id }, i (id ?? json.stringify({ type, value }))}
        <div animate:flip={{ duration: 300 }}>
        <Expand>
            <span slot="header" class="center x-flex-full">
                <span></span>
                <span class="clear small emphasis">{type}</span>
                <div class="commands">
                    {#if i > 0}
                    <button class="icon clear" {disabled} title="Move up"
                        on:click={() => moveUp($document, i)}>
                        <i class="bx bx-up-arrow"></i>
                    </button>
                    {/if}
                    {#if i < $document.content.length - 1}
                    <button class="icon clear" {disabled} title="Move down"
                        on:click={() => moveDown($document, i)}>
                        <i class="bx bx-down-arrow"></i>
                    </button>
                    {/if}
                    <button class="icon clear" {disabled} title="Add section"
                        on:click={addSectionMenu.showPopupMenu}>
                        <i class="bx bx-plus"></i>
                    </button>
                    <button class="icon clear" {disabled} title="Edit section"
                        on:click={(ev) => showPopupMenu(ev, i)}>
                        <i class="bx bx-dots-vertical"></i> <!-- ⋮ -->
                    </button>
                </div>
            </span>
            <div class="section" class:jse-theme-dark={$colorScheme === 'dark'}>
                {#if typeof value === 'string' && isMarkdown($contentTypes[type])}
                    <MarkdownEditor {value} placeholder={type}
                        on:focus={() => currentIndex = i}
                        on:change={({ detail }) => updateSection($document, detail, i)} />
                {:else if Array.isArray(value)}
                    <JSONEditor mainMenuBar={false} mode={Mode.text} content={{ json: value }} 
                        onChange={(content) => updateJson($document, content, i)} />
                {:else if typeof value === 'object'}
                    <PropertyEditor document={value} properties={contentProperties(type)} 
                        on:update={({ detail }) => updateSection($document, detail, i)}/>
                {:else}
                    <h2 class="emphasis center">WYSIWYG yet not implemented</h2>
                    <JSONEditor mainMenuBar={false} mode={Mode.text} content={{ json: value }} 
                        onChange={(content) => updateJson($document, content, i)} />
                {/if}
            </div>
        </Expand>
        </div>
        {/each}

        <PopupMenu bind:this={editSectionMenu}>
            <div class="small menu no-wrap y-flex">
                <button class="btn" {disabled} on:click={() => removeSection($document)}>
                    <span class="emphasis"><i class="bx bx-trash danger"></i> remove</span>
                </button>
            </div>
        </PopupMenu>

        <PopupMenu bind:this={addSectionMenu}>
            <div class="small menu y-flex">
                <div class="center emphasis" style="margin:.4em .8em">Add section</div>
                {#each Object.keys($contentTypes) as type}
                    <button class="btn" {disabled} on:click={() => insertSection(type, $document)}>
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
    .menu {
        background-color: var(--color-bg-2);

        button {
            text-align: left;
        }
    }

    .commands {
        padding-right: 2em;
    }
</style>
