<script lang="ts">
    import { flip } from 'svelte/animate';
    import { link, querystring } from 'svelte-spa-router';
    import json from 'json5';
    import { combineLatest, map, startWith, switchMap } from 'rxjs';
    import type { AnyProperty, Properties } from '../../lib/packages/firecms_core/types/properties';
    import Toolbar from '../../lib/components/Toolbar.svelte';
    import PopupMenu from '../../lib/components/PopupMenu.svelte';
    import type { Content, SectionType } from '../../lib/models/content.type';
    import { currentClientUser } from '../../lib/stores/app.store';
    import { arrayToMap, defaultValueByType, mergeObject } from '../../lib/models/content.helper';
    import { getContentStore, getCurrentScheme } from '../../lib/stores/db/firestore.store';
    import { showInfo, showWarn } from '../../lib/stores/notification.store';
    import { fromStore } from '../../lib/utils/rx.store';
    import { isUnique } from '../../lib/utils/ui.helper';
    import Section from './Section.svelte';

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

    function showPopupMenu(event: MouseEvent, role: 'add' | 'edit', index?: number) {
        currentIndex = index;
        if (role === 'edit') {
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
        const item: SectionType = {
            type,
            value: defaultValueByType($contentTypes[type]),
            __id: Date.now()
        };
        if (currentIndex !== undefined && isUnique(document.content, item)
            && document.content.insert(item, currentIndex + 1)) {
            $contentStore$.setDocuments(document);
        }
        currentIndex = undefined;
    }

    function moveUp(document: Content, index: number) {
        if (document.content.swap(index, index - 1)) {
            $contentStore$.setDocuments(document);
        }
    }

    function moveDown(document: Content, index: number) {
        if (document.content.swap(index, index + 1)) {
            $contentStore$.setDocuments(document);
        }
    }

    async function updateSection(document: Content, partial: object, index: number) {
        const section = document.content[index];
        if (section.value !== partial) {
            section.value = mergeObject(section.value, partial);
            await $contentStore$.setDocuments(document);
            
            showInfo(`Contents of section #${index + 1} [${section.type}] updated.`);
        }
    }

    function removeSection(document: Content) {
        if (currentIndex !== undefined && document.content.remove(currentIndex)) {
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

        <Section open={false} value={$document$} title="Details of {$currentSchema?.name}"
            property={{ dataType: 'map', properties: $properties }} type="details"
            on:change={({ detail }) => updateProperty($document$, detail)}>
            <span slot="commands">
                <button class="icon clear" {disabled} title="Add section"
                    on:click={(ev) => showPopupMenu(ev, 'add', 0)}>
                    <i class="bx bx-plus"></i>
                </button>
            </span>
        </Section>
        
        {#each $document$.content as { type, value, __id }, i (__id ?? json.stringify({ type, value }))}
        <div animate:flip={{ duration: 300 }}>
        <Section {value} {type} property={$contentTypes[type]} {disabled}
            on:change={({ detail }) => updateSection($document$, detail, i)}>
            <span slot="commands">
                <button class="icon clear" {disabled} title="Add section"
                    on:click={(ev) => showPopupMenu(ev, 'add', i)}>
                    <i class="bx bx-plus"></i>
                </button>
                <button class="icon clear" {disabled} title="Move up"
                    on:click={() => moveUp($document$, i)}>
                    <i class="bx bx-up-arrow"></i>
                </button>
                <button class="icon clear" {disabled} title="Move down"
                    on:click={() => moveDown($document$, i)}>
                    <i class="bx bx-down-arrow"></i>
                </button>
                <button class="icon clear" {disabled} title="Edit section"
                    on:click={(ev) => showPopupMenu(ev, 'edit', i)}>
                    <i class="bx bx-dots-vertical"></i> <!-- ⋮ -->
                </button>
            </span>
        </Section>
        </div>
        {/each}

        <PopupMenu bind:this={editSectionMenu}>
            <div class="small popup-menu no-wrap y-flex">
                <button class="btn" {disabled} on:click={() => removeSection($document$)}>
                    <span class="emphasis"><i class="bx bx-trash danger"></i> remove</span>
                </button>
            </div>
        </PopupMenu>

        <PopupMenu bind:this={addSectionMenu}>
            <div class="small popup-menu y-flex">
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
</style>
