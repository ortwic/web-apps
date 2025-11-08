<script lang="ts">
    import { derived, get } from 'svelte/store';
    import { link, querystring } from 'svelte-spa-router';
    import { map } from 'rxjs';
    import type { AnyProperty, Properties, StringProperty } from '../../lib/packages/firecms_core/types/properties';
    import Expand from '../../lib/components/Expand.svelte';
    import Toolbar from '../../lib/components/Toolbar.svelte';
    import PopupMenu from '../../lib/components/PopupMenu.svelte';
    import type { ContentDocument, UpdatePropertyArgs } from '../../lib/models/content.type';
    import { currentClientUser } from '../../lib/stores/app.store';
    import { arrayToMap, defaultValueByType } from '../../lib/utils/property.helper';
    import { createDocumentStore, getCurrentScheme } from '../../lib/stores/db/firestore.store';
    import { showInfo } from '../../lib/stores/notification.store';
    import TextEditor from './TextEditor.svelte';
    import PropertyEditor from './PropertyEditor.svelte';

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
        map(schema => arrayToMap((schema?.properties as Properties)['content']))
    );

    let currentIndex: number | undefined;
    let addSectionMenu: PopupMenu, editSectionMenu: PopupMenu;

    function showPopupMenu(event: MouseEvent, index?: number) {
        if (index !== undefined) {
            currentIndex = index;
            editSectionMenu.showPopupMenu(event);
        } else {
            addSectionMenu.showPopupMenu(event);
        }
    }

    function isMarkdown(type: string) {
        return ($contentTypes && $contentTypes[type] as StringProperty)?.markdown === true;
    }

    async function updateProperty(document: ContentDocument, { field, value }: UpdatePropertyArgs) {
        document[field] = value;
        await $contentStore.setDocuments(document);
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
            document.content.unshift({ type, value });
        }
        $contentStore.setDocuments(document);

        currentIndex = undefined;
    }

    async function updateSection(document: ContentDocument, content: string, index: number) {
        const section = document.content[index];
        if (section.value !== content) {
            section.value = content;
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
            <span slot="header" class="center">
                <button class="clear small emphasis" on:click={showPopupMenu}>Details of {$currentSchema?.name} ⋮</button>
            </span>
            <div>
                <PropertyEditor document={$document} properties={$properties} 
                    on:update={({ detail }) => updateProperty($document, detail)}/>
            </div>
        </Expand>
        
        {#each $document.content as { type, value }, index}
        <Expand>
            <span slot="header" class="center">
                <button class="clear small emphasis" on:click={(ev) => showPopupMenu(ev, index)}>{type} ⋮</button>
            </span>
            <div class="element">
                {#if typeof value === 'string' && isMarkdown(type)}
                    <TextEditor {value} intervalInSecs={10}
                        on:focus={() => currentIndex = index}
                        on:autosave={({ detail }) => updateSection($document, detail, index)}
                        on:blur={({ detail }) => updateSection($document, detail, index)} />
                {:else}
                    <pre>{JSON.stringify(value, null, 2)}</pre>
                {/if}
            </div>
        </Expand>
        {/each}

        <PopupMenu bind:this={editSectionMenu}>
            <div class="small menu no-wrap y-flex">
                <button class="btn" {disabled} on:click={addSectionMenu.showPopupMenu}>
                    <span class="emphasis"><i class="bx bx-plus"></i> add section</span>
                </button>
                <button class="btn" {disabled} on:click={() => removeSection($document)}>
                    <span class="emphasis"><i class="bx bx-minus"></i> remove section</span>
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
