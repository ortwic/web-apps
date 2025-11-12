<script lang="ts">
    import 'bytemd/dist/index.css';
    import { Editor as MarkdownEditor } from 'bytemd';
    import json from 'json5';    
    import { createEventDispatcher } from "svelte";
    import { JSONEditor, Mode, type Content } from "svelte-jsoneditor";
    import { colorScheme } from "@web-apps/svelte-tabulator";
    import type { AnyProperty, MapProperty } from '../../lib/packages/firecms_core/types/properties';
    import { showError } from "../../lib/stores/notification.store";
    import { isMapProperty, isMarkdown } from "../../lib/models/content.helper";
    import PropertyEditor from "./PropertyEditor.svelte";

    const dispatch = createEventDispatcher();

    type T = $$Generic<object>;
    export let value: string | T;
    export let type: string;
    export let property: AnyProperty;

    $: properties = getProperties(property);

    function getProperties(prop: AnyProperty): Record<string, AnyProperty> {
        if (prop && isMapProperty(prop)) {
            return prop.properties as Record<string, AnyProperty>;
        }
        return {};
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

    function change(value: T) {
        dispatch('change', value);
    }

</script>

<div class="section" class:jse-theme-dark={$colorScheme === 'dark'}>
    {#if typeof value === 'string' && isMarkdown(property)}
        <MarkdownEditor {value} placeholder={type} 
            on:change={({ detail }) => change(detail['value'])} />
    {:else if Array.isArray(value)}
        {#each value as item, i}
        <svelte:self {property} {type} value={item} 
            on:change={({ detail }) => change(detail)} />
        {/each}
    {:else if typeof value === 'object'}
        <PropertyEditor document={value} {properties} 
            on:update={({ detail }) => change(detail)}/>
    {:else}
        <h2 class="emphasis center">WYSIWYG yet not implemented</h2>
        <JSONEditor mainMenuBar={false} mode={Mode.text} content={{ json: value }} 
            onChange={(content) => updateJson(content)} />
    {/if}
</div>