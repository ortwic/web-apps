<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { DocumentData } from "firebase/firestore";
  import type { AnyProperty, ArrayProperty } from "../../packages/firecms_core/types/properties.simple";
  import { isImageUrl, mergeObject } from "../../models/content.helper";
  import { currentClientUser } from "../../stores/app.store";
  import { timestampToIsoDate } from "../../stores/db/firestore.store";
  import Expand from '../ui/Expand.svelte';
  import MarkdownEditor from "../ui/MarkdownEditor.svelte";
  import ImageSelect from "./ImageSelect.svelte";
  import TagCloud from "../ui/TagCloud.svelte";
  import Input from "../ui/Input.svelte";
  
  export let document: DocumentData;
  export let properties: Record<string, AnyProperty>;

  const dispatch = createEventDispatcher();

  $: disabled = !$currentClientUser;

  function isoToLocal(field: string) {
    try {
        const value = document[field];
        return timestampToIsoDate(value)?.slice(0,16);
    } catch (error: any) {
        console.warn(`error parsing timestamp for field '${field}`, error.message);
    }
  }

  function useTagCloud(field: string): boolean {
    const prop = properties[field] as ArrayProperty;
    if (Array.isArray(document[field]) && properties[field].dataType === 'array') {
        return prop?.of?.dataType === 'string';
    }
    return false;
  }

  function update<T>(value: T, field: string) {
    dispatch('update', { [field]: value });
  }

  function updateInput(event: Event & { currentTarget: EventTarget & HTMLInputElement; }, field: string) {
    dispatch('update', { [field]: event.currentTarget.value });
  }

  function updateNested(old: object, value: object, field: string) {
    if (old !== value) {
        dispatch('update', { [field]: mergeObject(old, value) });
    }
  }

</script>

{#if document && typeof properties === 'object'}
<ul>
    {#each Object.entries(properties) as [field, prop]}
    {#if document[field] !== undefined}
    <li title="{prop.dataType}">
        <div class="grid">
            {#if prop.dataType === 'map'}
            <Expand>
                <span slot="header" class="emphasis no-wrap center">{prop.name ?? field}</span>
                <div class="indent">
                    <svelte:self document="{document[field]}" properties="{prop.properties}"
                        on:update={({ detail }) => updateNested(document[field], detail, field)} />
                </div>
            </Expand>
            {:else if prop.dataType === 'string' && prop.markdown === true}
            <span class="colspan">
                <MarkdownEditor value={document[field] ?? ''} {disabled} placeholder={prop.name}
                    mediaPath={`${prop.storage?.storagePath}`} storeUrl={prop.storage?.storeUrl}
                    on:change={({ detail }) => update(detail, field)} />
            </span>
            {:else}
                <label for="{field}">{prop.name ?? field}</label>
                {#if prop.dataType === 'string' && isImageUrl(prop)}
                <ImageSelect value={document[field]} alt={field} storage={prop.storage} disabled="{disabled || prop.editable === false}" 
                    on:changed={({ detail }) => update(detail, field)} />
                {:else if prop.dataType === 'string' && prop.enumValues?.length}
                <select id="{field}" disabled="{disabled || prop.editable === false}" 
                    value="{document[field] ?? ''}" 
                    on:change={(ev) => update(ev, field)}>
                    {#if Array.isArray(prop.enumValues)}
                        {#each prop.enumValues as value}
                        <option value="{value.id}">{value.label}</option>
                        {/each}
                    {:else}
                        {#each Object.keys(prop.enumValues) as key, i}
                        <option value="{key}">{JSON.stringify(prop.enumValues[i])}</option>
                        {/each}
                    {/if}
                </select>
                {:else if useTagCloud(field)}
                <TagCloud labels="{document[field]}" on:change={({ detail }) => update(detail, field)} />
                {:else if prop.dataType === 'boolean'}
                <input type="checkbox" id="{field}" disabled="{disabled || prop.editable === false}" 
                    checked="{document[field] ?? false}" on:input={(ev) => updateInput(ev, field)} />
                {:else if prop.dataType === 'string'}
                <Input type="text" id="{field}" disabled="{disabled || prop.editable === false}" 
                    value="{document[field] ?? ''}" on:changed={({ detail }) => update(detail, field)} />
                {:else if prop.dataType === 'number'}
                <Input type="number" id="{field}" disabled="{disabled || prop.editable === false}" 
                    value="{document[field] ?? ''}" on:changed={({ detail }) => update(detail, field)} />
                {:else if prop.dataType === 'date'}
                <Input type="datetime-local" id="{field}" disabled="{disabled || prop.editable === false}" 
                    value="{isoToLocal(field)}" on:changed={({ detail }) => update(detail, field)} />
                {:else}
                <span>
                    <pre id="{field}" class="colspan">{JSON.stringify(document[field], null, 2)}</pre>
                </span>
                {/if}
            {/if}
        </div>
    </li>
    {/if}
    {/each}
</ul>
{:else if (!document)}
    <h2 class="emphasis no-wrap">Missing data node</h2>
{:else}
    <h2 class="emphasis no-wrap">Unsupported data structure</h2>
    {#if properties}
    <pre>{JSON.stringify(properties, null, 2)}</pre>
    {/if}
{/if}

<style>
    ul {
        list-style: none;
        padding: 0;
    }

    li {
        margin-bottom: 1em;
    }

    .grid {
        width: 30em;
        display: grid;
        grid-template-columns: 1fr 2fr;
        gap: 1rem;
    }

    .grid > .colspan {
        grid-column: 1 / span 2;
    }

    .indent {
        padding: .6em 0;
        text-indent: .6em;
        border-left: .4em solid var(--color-bg-1);
    }
</style>