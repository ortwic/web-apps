<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { AnyProperty } from '../../packages/firecms_core/types/properties.simple';
    import JSONEditor from '../ui/JSONEditor.svelte';
    import Expand from '../ui/Expand.svelte';
    import Input from '../ui/Input.svelte';
    import MarkdownEditor from '../ui/MarkdownEditor.svelte';
    import { isBlockSetProperty, isFileType, isUrlProperty, isMapProperty, isMarkdown } from "../../utils/content.helper";
    import ImageSelect from './ImageSelect.svelte';
    import PropertyMap from "./PropertyMap.svelte";
    import SectionCards from './SectionCards.svelte';

    type T = $$Generic<ValueType>;
    export let open = true;
    export let title = '';
    export let type: string | undefined;
    export let value: T;
    export let property: AnyProperty;
    export let disabled = false;

    const dispatch = createEventDispatcher<{ change: any }>();

    function getProperties(prop: AnyProperty): Record<string, AnyProperty> {
        if (prop) {
            if (isMapProperty(prop)) {
                return prop.properties as Record<string, AnyProperty>;
            }
            if (isBlockSetProperty(prop)) {
                return prop.oneOf?.properties as Record<string, AnyProperty>;
            }
        }
        return {};
    }

    function change<U>(value: U) {
        if (value) {
            dispatch('change', value);
        }
    }

</script>

<Expand {open}>
    <span slot="header" class="x-flex-full">
        <span class="clear small emphasis">{title || type}</span>
        <div class="commands">
            <slot name="commands"></slot>
        </div>
    </span>
    <div class="section">
        {#if typeof value === 'string' &&  isMarkdown(property)}
        <MarkdownEditor {value} placeholder={type} disabled="{disabled || property.editable === false}"
            on:change={({ detail }) => change(detail)} />
        {:else if typeof value === 'string' && property?.dataType === 'string'}
        <Input type="text" {value} placeholder={type} disabled="{disabled || property.editable === false}" 
            on:changed={({ detail }) => change(detail)} multiline={property.multiline}/>
        {:else if isUrlProperty(property)}
        <Input type="url" {value} placeholder={type} disabled="{disabled || property.editable === false}" 
            on:changed={({ detail }) => change(detail)} />
        {:else if isFileType(property, 'image')}
        <ImageSelect {value} alt={type} storage={property.storage} disabled="{disabled || property.editable === false}" 
            on:changed={({ detail }) => change(detail)} />
        {:else if Array.isArray(value)}
        <SectionCards {property} items={value} 
            on:change={({ detail }) => change(detail)}/>
        {:else if typeof value === 'object'}
        <PropertyMap document={value} properties={getProperties(property)} 
            on:update={({ detail }) => change(detail.data)}/>
        {:else}
        <Expand>
            <span slot="header" class="emphasis" title="Not implemented">
                Missing '{property?.dataType}' for {typeof value} type
            </span>
            <JSONEditor {value} on:changed={({ detail }) => change(detail)} />
        </Expand>
        <Expand open={false}>
            <span slot="header" class="emphasis">Details of '{property?.dataType}'</span>
            <JSONEditor value={property} />
        </Expand>
        {/if}
    </div>
</Expand>

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