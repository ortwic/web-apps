<script lang="ts">
    import 'bytemd/dist/index.css';
    import { nanoid } from 'nanoid';
    import { Editor as MarkdownEditor } from 'bytemd';
    import json from 'json5';    
    import { createEventDispatcher } from "svelte";
    import { JSONEditor, Mode, type Content } from "svelte-jsoneditor";
    import { colorScheme } from "@web-apps/svelte-tabulator";
    import type { AnyProperty } from '../../lib/packages/firecms_core/types/properties';
    import Expand from '../../lib/components/Expand.svelte';
    import PopupMenu from '../../lib/components/PopupMenu.svelte';
    import { showError } from "../../lib/stores/notification.store";
    import { arrayToMap, defaultValueByType, isArrayProperty, isMapProperty, isMarkdown, mergeObject } from "../../lib/models/content.helper";
    import PropertyEditor from "./PropertyEditor.svelte";

    const dispatch = createEventDispatcher();

    type T = $$Generic<ValueType>;
    export let open = true;
    export let title = '';
    export let type: string | undefined;
    export let value: T;
    export let property: AnyProperty;
    export let disabled = false;

    let array = Array.isArray(value) ? value as any[] : undefined;
    let addElementMenu: PopupMenu;
    
    $: uniformedArray = isArrayProperty(property) && property.of;
    $: ambigiousArray = isArrayProperty(property) && 'keyValue' in property && property.keyValue && property.oneOf;
    $: elementTypes = arrayToMap(property);

    function getProperties(prop: AnyProperty): Record<string, AnyProperty> {
        if (prop) {
            if (isMapProperty(prop)) {
                return prop.properties as Record<string, AnyProperty>;
            }
            if (isArrayProperty(prop)) {
                console.log({ [type ?? '']: prop })
                if (prop.oneOf) {
                    return prop.oneOf?.properties as Record<string, AnyProperty>;
                }
            }
        }
        return {};
    }

    function byType(prop: AnyProperty, type: string): AnyProperty | undefined {
        if (isArrayProperty(prop) && prop.oneOf && type) {
            return prop.oneOf.properties[type];
        }
        return undefined;
    }

    function addElement(event: MouseEvent, type?: string) {
        if (array) {
            if (ambigiousArray) {
                if (type) {
                    const prop = byType(property, type);
                    const value = defaultValueByType(prop!) as T;
                    array = [...array, { type, value, id: nanoid() }];
                    change(array as T);
                } else {
                    addElementMenu.showPopupMenu(event);
                }
            } else {
                const value = defaultValueByType(uniformedArray as AnyProperty) as T;
                array = [...array, value];
                change(array as T);
            }
        }
    }

    function updateElement<U>(partial: U, index: number, type?: string) {
        if (array) {
            if (ambigiousArray) {
                const value = mergeObject(array[index].value, partial);
                array = array.toSpliced(index, 1, { type, value });
                change(array);
            } else {
                const value = mergeObject(array[index], partial);
                array = array.toSpliced(index, 1, value);
                change(array);
            }
        }
    }

    function removeElement(index: number) {
        if (array) {
            array = array.toSpliced(index, 1);
            change(array);
        }
    }

    function updateJson(content: Content) {
        if ('text' in content) {
            try {   
                const value = json.parse(content.text);
                change(value);
            } catch (error) {
                showError(`Invalid JSON: ${error}`);
            }
        }
    }

    function change<U>(value: U) {
        dispatch('change', value);
    }

</script>

<Expand {open}>
    <span slot="header" class="x-flex-full">
        <span class="clear small emphasis">{title || type}</span>
        <div class="commands">
            {#if array}
                <button class="icon clear" {disabled} on:click={addElement}>
                    <i class="bx bx-list-plus"></i>
                </button>
            {/if}
            <slot name="commands"></slot>
        </div>
    </span>
    <div class="section" class:jse-theme-dark={$colorScheme === 'dark'}>
        {#if typeof value === 'string' && isMarkdown(property)}
            <MarkdownEditor {value} placeholder={type} 
                on:change={({ detail }) => change(detail['value'])} />
        {:else if typeof value === 'object' && !array}
            <PropertyEditor document={value} properties={getProperties(property)} 
                on:update={({ detail }) => change(detail)}/>
        {:else if array && ambigiousArray}
            <div class="x-flex">        
                {#each array as item, i}
                <div class="card">
                    {#if typeof item === 'object' && 'type' in item && 'value' in item}
                    <svelte:self property={byType(property, item.type)} type={item.type} value={item.value} 
                        on:change={({ detail }) => updateElement(detail, i, item.type)}>
                        <div slot="commands">
                            <button class="icon clear" {disabled} on:click={() => removeElement(i)}>
                                <i class="bx bx-x"></i>
                            </button>
                        </div>
                    </svelte:self>
                    {/if}
                </div>
                {/each}
            </div>
        {:else if array && uniformedArray}
            <div class="x-flex">
                {#each array as item, i}
                <div class="card">
                    <svelte:self property={uniformedArray} type={i} value={item} 
                        on:change={({ detail }) => updateElement(detail, i)}>
                        <div slot="commands">
                            <button class="icon clear" {disabled} on:click={() => removeElement(i)}>
                                <i class="bx bx-x"></i>
                            </button>
                        </div>
                    </svelte:self>
                </div>
                {/each}
            </div>
        {:else}
            <h2 class="emphasis center">WYSIWYG yet not implemented</h2>
            <JSONEditor mainMenuBar={false} mode={Mode.text} content={{ json: value }} 
                onChange={(content) => updateJson(content)} />
        {/if}
    </div>
</Expand>

<PopupMenu bind:this={addElementMenu}>
    <div class="small popup-menu y-flex">
        <div class="center emphasis" style="margin:.4em .8em">&mdash; Add &mdash;</div>
        {#each Object.keys(elementTypes) as type}
            <button class="btn" {disabled} on:click={(ev) => addElement(ev, type)}>
                <span class="emphasis"> {type}</span>
            </button>
        {/each}
    </div>
</PopupMenu>

<style lang="scss">
    .card {
        background-color: var(--color-bg-2);
        border: 1px solid var(--color-bg-0);
        padding: .2em .4em;

        .overlay {
            background-color: transparent;
        }
    }

    .commands {
        padding-right: .2em;
    }

</style>