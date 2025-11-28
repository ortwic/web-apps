<script lang="ts" generics="T extends Entity">
    import { flip } from 'svelte/animate';
    import { params, push } from 'svelte-spa-router';
    import json from 'json5';
    import { combineLatest, map, Observable, of, startWith, switchMap } from 'rxjs';
    import type { AnyProperty, Properties } from '../../packages/firecms_core/types/properties.simple';
    import Toolbar from '../ui/Toolbar.svelte';
    import PopupMenu from '../ui/PopupMenu.svelte';
    import type { SectionType } from '../../models/content.type';
    import { currentClientUser } from '../../stores/app.store';
    import type { Collection, Entity } from '../../models/schema.model';
    import { arrayPropertyToMapProperty, defaultValueByType, mergeObject } from '../../models/content.helper';
    import { DocumentStore } from '../../stores/db/document.service';
    import { showInfo } from '../../stores/notification.store';
    import { isUnique } from '../../utils/ui.helper';
    import Breadcrumb from '../ui/Breadcrumb.svelte';
    import Loading from '../ui/Loading.svelte';
    import Section from './Section.svelte';

    $: disabled = !$currentClientUser;

    export let contentSchema = of<Collection | null>(null);
    export let contentStore: Observable<DocumentStore<T>>;
    export let contentKey: keyof T & string;
    export let id = of('');

    const document$ =  combineLatest([contentStore, id]).pipe(switchMap(([store, id]) => store.getDocument(id)));

    const properties = contentSchema.pipe(
        map(schema => Object.entries(schema?.properties as Properties ?? [])
            .filter(([field]) => field !== contentKey)
            .reduce((acc, [field, prop]) => {
                acc[field] = prop;
                return acc;
            }, {} as Record<string, AnyProperty>)
        )
    );
    const contentTypes = contentSchema.pipe(
        map(schema => arrayPropertyToMapProperty((schema?.properties as Properties)[contentKey])),
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

    async function updateProperty(document: T, partial: Partial<T>) {
        if (partial && document) {
            Object.entries(partial).forEach(([field, value]) => (document as any)[field] = value);
            await $contentStore.setDocuments(document);
        }
    }

    function insertSection(type: string, document: T) {
        const item: SectionType = {
            type,
            value: defaultValueByType($contentTypes[type]),
            __id: Date.now()
        };
        if (!document[contentKey]) {
            (document as any)[contentKey] = [];
        }

        if (currentIndex !== undefined && isUnique(document[contentKey], item)
            && document[contentKey].insert(item, currentIndex)) {
            $contentStore.setDocuments(document);
        }
        currentIndex = undefined;
    }

    function moveUp(document: T, index: number) {
        if (document[contentKey].swap(index, index - 1)) {
            $contentStore.setDocuments(document);
        }
    }

    function moveDown(document: T, index: number) {
        if (document[contentKey].swap(index, index + 1)) {
            $contentStore.setDocuments(document);
        }
    }

    async function updateSection(document: T, partial: object, index: number) {
        const section = document && document[contentKey][index];
        if (section && section.value !== partial) {
            section.value = mergeObject(section.value, partial);
            await $contentStore.setDocuments(document);
            
            showInfo(`Contents of section #${index + 1} [${section.type}] updated.`);
        }
    }

    function removeSection(document: T) {
        if (currentIndex !== undefined && document[contentKey].remove(currentIndex)) {
            $contentStore.setDocuments(document);

            currentIndex = undefined;
        }
    }
</script>

<header>
    <Toolbar showNav={true}>
        <slot name="commands"></slot>
        <span slot="title">
            <Breadcrumb path={`${$contentStore.path}/${$id}`} rootPath="/page" on:navigate={({ detail: path }) => push(`/${path}`)} />
        </span>
    </Toolbar>
</header>

<section class="content-64">
    {#if $document$}
        <Section open={!$document$[contentKey]?.length} value={$document$} title="Details of {$contentSchema?.name}"
            property={{ dataType: 'map', properties: $properties }} type="details"
            on:change={({ detail }) => updateProperty($document$, detail)}>
            <span slot="commands">
                <button class="icon clear" {disabled} title="Add section"
                    on:click={(ev) => showPopupMenu(ev, 'add', 0)}>
                    <i class="bx bx-plus"></i>
                </button>
            </span>
        </Section>
        
        {#each $document$[contentKey] ?? [] as { type, value, __id }, i (__id ?? json.stringify({ type, value }))}
        <div animate:flip={{ duration: 300 }}>
        <Loading isLoading={!$contentTypes[type]}>
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
        </Loading>
        </div>
        {/each}

        <PopupMenu bind:this={editSectionMenu}>
            <div class="small popup-menu no-wrap y-flex">
                <button class="btn" {disabled} on:click={() => removeSection($document$)}>
                    <span class="emphasis"><i class="bx bx-trash"></i> remove</span>
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
        <h2 class="emphasis">Document '{$params?.wild}' not found</h2>
    {/if}
</section>

<style lang="scss">
</style>
