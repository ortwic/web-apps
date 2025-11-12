<script lang="ts">
    import { flip } from 'svelte/animate';
    import { link, querystring } from 'svelte-spa-router';
    import json from 'json5';
    import { nanoid } from 'nanoid';
    import { combineLatest, map, startWith, switchMap } from 'rxjs';
    import type { AnyProperty, Properties } from '../../lib/packages/firecms_core/types/properties';
    import Expand from '../../lib/components/Expand.svelte';
    import Toolbar from '../../lib/components/Toolbar.svelte';
    import PopupMenu from '../../lib/components/PopupMenu.svelte';
    import type { Content } from '../../lib/models/content.type';
    import { currentClientUser } from '../../lib/stores/app.store';
    import { arrayToMap, defaultValueByType, mergeObject } from '../../lib/models/content.helper';
    import { getContentStore, getCurrentScheme } from '../../lib/stores/db/firestore.store';
    import { showInfo } from '../../lib/stores/notification.store';
    import { fromStore } from '../../lib/utils/rx.store';
    import Section from './Section.svelte';
    import PropertyEditor from './PropertyEditor.svelte';

    $: disabled = !$currentClientUser;

    const path$ = fromStore(querystring).pipe(map((path) => {
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
    }));
    const contentStore$ = path$.pipe(switchMap(({ path }) => fromStore(getContentStore(path))));
    const document$ =  combineLatest([contentStore$, path$]).pipe(switchMap(([store, { id }]) => store.getDocument(id)));

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

    async function updateProperty(document: Content, obj: Record<string, unknown>) {
        Object.entries(obj).forEach(([field, value]) => document[field] = value);
        await $contentStore$.setDocuments(document);
    }

    function insertSection(type: string, document: Content) {
        const value = defaultValueByType($contentTypes[type]) as object;
        if (currentIndex !== undefined && currentIndex < document.content.length) {
            document.content.splice(currentIndex + 1, 0, { type, value, id: nanoid() });
        } else {
            document.content.unshift({ type, value, id: nanoid() });
        }
        $contentStore$.setDocuments(document);

        currentIndex = undefined;
    }

    function moveUp(document: Content, index: number) {
        if (index > 0) {
            const section = document.content[index];
            document.content.splice(index, 1);
            document.content.splice(index - 1, 0, section);
            $contentStore$.setDocuments(document);
        }
    }

    function moveDown(document: Content, index: number) {
        if (index < document.content.length - 1) {
            const section = document.content[index];
            document.content.splice(index, 1);
            document.content.splice(index + 1, 0, section);
            $contentStore$.setDocuments(document);
        }
    }

    async function updateSection(document: Content, value: object, index: number) {
        const section = document.content[index];
        if (section.value !== value) {
            section.value = mergeObject(section.value, value);
            await $contentStore$.setDocuments(document);
            
            showInfo(`Contents of section #${index + 1} [${section.type}] updated.`);
        }
    }

    function removeSection(document: Content) {
        if (currentIndex !== undefined) {
            document.content.splice(currentIndex, 1);
            $contentStore$.setDocuments(document);

            currentIndex = undefined;
        }
    }
</script>

<section class="content-64">
    {#if $document$}
        <Toolbar>
            <span slot="title"><a use:link href="/manage">{$document$.id}</a></span>
        </Toolbar>

        <Expand open={false}>
            <span slot="header" class="x-flex-full">
                <span class="clear small emphasis">Details of {$currentSchema?.name}</span>
                <div class="commands">
                    <button class="icon clear" {disabled} title="Add section"
                        on:click={addSectionMenu.showPopupMenu}>
                        <i class="bx bx-plus"></i>
                    </button>
                </div>
            </span>
            <div class="section">
                <PropertyEditor document={$document$} properties={$properties} 
                    on:update={({ detail }) => updateProperty($document$, detail)}/>
            </div>
        </Expand>
        
        {#each $document$.content as { type, value, id }, i (id ?? json.stringify({ type, value }))}
        <div animate:flip={{ duration: 300 }}>
        <Expand>
            <span slot="header" class="x-flex-full">
                <span class="clear small emphasis">{type}</span>
                <div class="commands">
                    {#if i > 0}
                    <button class="icon clear" {disabled} title="Move up"
                        on:click={() => moveUp($document$, i)}>
                        <i class="bx bx-up-arrow"></i>
                    </button>
                    {/if}
                    {#if i < $document$.content.length - 1}
                    <button class="icon clear" {disabled} title="Move down"
                        on:click={() => moveDown($document$, i)}>
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
            <Section {value} {type} property={$contentTypes[type]} 
                on:change={({ detail }) => updateSection($document$, detail, i)} />
        </Expand>
        </div>
        {/each}

        <PopupMenu bind:this={editSectionMenu}>
            <div class="small menu no-wrap y-flex">
                <button class="btn" {disabled} on:click={() => removeSection($document$)}>
                    <span class="emphasis"><i class="bx bx-trash danger"></i> remove</span>
                </button>
            </div>
        </PopupMenu>

        <PopupMenu bind:this={addSectionMenu}>
            <div class="small menu y-flex">
                <div class="center emphasis" style="margin:.4em .8em">&mdash; Add &mdash;</div>
                {#each Object.keys($contentTypes) as type}
                    <button class="btn" {disabled} on:click={() => insertSection(type, $document$)}>
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
    }

    .commands {
        padding-right: 2em;
    }
</style>
