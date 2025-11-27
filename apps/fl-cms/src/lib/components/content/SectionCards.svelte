<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { flip } from "svelte/animate";
    import type { AnyProperty, Properties } from "../../packages/firecms_core/types/properties.simple";
    import { arrayPropertyToMapProperty, defaultValueByType, isArrayProperty, isBlockSetProperty, mergeObject } from "../../models/content.helper";
    import type { SectionType } from "../../models/content.type";
    import { withKey } from "../../utils/ui.helper";
    import Loading from "../ui/Loading.svelte";
    import PopupMenu from '../ui/PopupMenu.svelte';
    import Section from "./Section.svelte";

    type T = $$Generic<ValueType>;
    export let title = '';
    export let items: T[];
    export let property: AnyProperty;
    export let disabled = false;
    
    const dispatch = createEventDispatcher<{ change: any }>();
    let addElementMenu: PopupMenu;
    
    $: repeatProperty = isArrayProperty(property) && property.of;
    $: blockSetProperties = isBlockSetProperty(property) && property.oneOf?.properties;

    function resolveProperty(item: any): AnyProperty {
        const record = blockSetProperties as Properties<any>;
        if (isTyped(item) && record && record[item.type]) {
            return record[item.type];
        } else {
            return repeatProperty as AnyProperty;
        }
    }

    function isTyped(item: any): item is SectionType {
        return typeof item === 'object' && 'type' in item && 'value' in item;
    }

    function addElement(event: MouseEvent, type?: string) {
        if (items) {
            if (blockSetProperties) {
                if (type !== undefined) {
                    const prop = resolveProperty({ type, value: null });
                    const value = defaultValueByType(prop) as T;
                    items = [...items, { type, value, __id: Date.now() } as T];
                    change(items as T);
                } else {
                    addElementMenu.showPopupMenu(event);
                }
            } else {
                const prop = resolveProperty({ type, value: null });
                const value = defaultValueByType(prop) as T;
                if (typeof value === 'object') {
                    items = [...items, { ...value, __id: Date.now() }];
                } else {
                    items = [...items, value];
                }
                change(items as T);
            }
        }
    }

    function updateElement<U>(partial: U | T, index: number, type?: string) {
        if (items) {
            if (type && blockSetProperties) {
                const value = mergeObject(items[index].value, partial);
                items = items.toSpliced(index, 1, { type, value } as T);
                change(items);
            } else {
                const value = mergeObject(items[index], partial) as T;
                items = items.toSpliced(index, 1, value);
                change(items);
            }
        }
    }

    function removeElement(index: number) {
        if (items) {
            items = items.toSpliced(index, 1);
            change(items);
        }
    }

    function swap(i: number, j: number) {
        items.swap(i, j);
        change([...items]);
    }

    function change<U>(value: U) {
        if (value) {
            dispatch('change', value);
        }
    }
</script>


<Loading isLoading={!items}>
    <div class="x-flex">
        {#each withKey(items) as { item, key }, i (key)}
        <div class="card" animate:flip={{ duration: 300 }}>
            {#if isTyped(item)}
            <Section value={item.value} {disabled} {title} 
                property={resolveProperty(item)} type={item.type}
                on:change={({ detail }) => updateElement(detail, i, item.type)}>
                <div slot="commands">
                    <button class="icon clear" {disabled} title="Move up"
                        on:click={() => swap(i, i - 1)}>
                        <i class="bx bx-up-arrow"></i>
                    </button>
                    <button class="icon clear" {disabled} title="Move down"
                        on:click={() => swap(i, i + 1)}>
                        <i class="bx bx-down-arrow"></i>
                    </button>
                    <button class="icon clear" {disabled} on:click={() => removeElement(i)}>
                        <i class="bx bx-x"></i>
                    </button>
                </div>
            </Section>
            {:else}
            <Section value={item} {disabled} {title} 
                property={resolveProperty(item)} type="#{i + 1}"
                on:change={({ detail }) => updateElement(detail, i)}>
                <div slot="commands">
                    <button class="icon clear" {disabled} title="Move up"
                        on:click={() => swap(i, i - 1)}>
                        <i class="bx bx-up-arrow"></i>
                    </button>
                    <button class="icon clear" {disabled} title="Move down"
                        on:click={() => swap(i, i + 1)}>
                        <i class="bx bx-down-arrow"></i>
                    </button>
                    <button class="icon clear" {disabled} on:click={() => removeElement(i)}>
                        <i class="bx bx-x"></i>
                    </button>
                </div>
            </Section>
            {/if}
        </div>
        {/each}
        <div class="card new y-flex">
            <span></span>
            <button class="icon clear" {disabled} on:click={(ev) => addElement(ev)}>
                <i class="bx bx-plus"></i>
            </button>
            <span></span>
        </div>
    </div>
</Loading>

<PopupMenu bind:this={addElementMenu}>
    <div class="small popup-menu y-flex" title="Add a new element">
        <div class="center emphasis" style="margin:.4em .8em">&mdash; Add &mdash;</div>
        {#each Object.keys(arrayPropertyToMapProperty(property)) as type}
            <button class="btn" {disabled} on:click={(ev) => addElement(ev, type)}>
                <span class="emphasis"> {type}</span>
            </button>
        {/each}
    </div>
</PopupMenu>

<style>
    .card.new {
        margin: 1em;
        border: 0;
    }
</style>