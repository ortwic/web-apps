<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { AnyProperty, CMSType } from '../../packages/firecms_core/types/properties.simple';
    import type { UpdateArgs } from "../../models/schema.type";
    import JSONEditor from '../ui/JSONEditor.svelte';
    import Expand from '../ui/Expand.svelte';
    import Input from '../ui/Input.svelte';
    import MarkdownEditor from '../ui/MarkdownEditor.svelte';
    import { isBlockSetProperty, isFileType, isUrlProperty, isMapProperty, isMarkdown } from "../../utils/content.helper";
    import ImageSelect from './ImageSelect.svelte';
    import PropertyMap from "./PropertyMap.svelte";
    import SectionCards from './SectionCards.svelte';

    type T = $$Generic<CMSType>;
    export let open = true;
    export let title = '';
    export let type: string | undefined;
    export let value: T;
    export let property: AnyProperty;
    export let disabled = false;

    const dispatch = createEventDispatcher<{ changed: UpdateArgs<T> }>();

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

    function changed<U>(data: U, merge = true) {
        if (data !== undefined && data !== null) {
            dispatch('changed', { data, merge });
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
        {#if typeof value === 'string' && isMarkdown(property)}
        <MarkdownEditor {value} placeholder={type} disabled="{disabled || property.editable === false}"
            on:changed={({ detail }) => changed(detail)} />
        {:else if typeof value === 'string' && isUrlProperty(property)}
        <Input type="url" {value} placeholder={type} disabled="{disabled || property.editable === false}" 
            on:changed={({ detail }) => changed(detail)} />
        {:else if typeof value === 'string' && isFileType(property, 'image')}
        <ImageSelect {value} alt={type} storage={property.storage} disabled="{disabled || property.editable === false}" 
            on:changed={({ detail }) => changed(detail)} />
        {:else if typeof value === 'string'}
        <Input type="text" {value} placeholder={type} disabled="{disabled || property.editable === false}" 
            on:changed={({ detail }) => changed(detail)} multiline={property?.dataType === 'string' ? property.multiline : false}/>
        {:else if Array.isArray(value)}
        <SectionCards {property} items={value} 
            on:changed={({ detail }) => changed(detail.data, detail.merge)}/>
        {:else if typeof value === 'object' && value !== null}
        <PropertyMap document={value} properties={getProperties(property)} 
            on:update={({ detail }) => changed(detail.data, detail.merge)}/>
        {:else}
        <Expand>
            <span slot="header" class="emphasis" title="Not implemented">
                Missing '{property?.dataType}' for {typeof value} type
            </span>
            <JSONEditor {value} on:changed={({ detail }) => changed(detail, false)} />
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