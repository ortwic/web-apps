<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { DocumentData } from "firebase/firestore";
  import type { AnyProperty } from "../../lib/packages/firecms_core/types/properties";
  import { currentClientUser } from "../../lib/stores/app.store";
  import { timestampToIsoDate } from "../../lib/stores/db/firestore.store";
  import Expand from '../../lib/components/Expand.svelte';
  import { isImageUrl, isMarkdown, mergeObject } from "../../lib/utils/property.helper";
  import ImageSelect from "./ImageSelect.svelte";
  import MarkdownEditor from "./MarkdownEditor.svelte";
  
  export let document: DocumentData;
  export let properties: Record<string, AnyProperty> | undefined;

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

  function update(value: string, field: string) {
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

{#if typeof properties === 'object'}
<ul>
    {#each Object.entries(properties) as [field, prop]}
    <li title="{prop.dataType}">
        <div class="grid">
            {#if isImageUrl(prop)}
            <label for="{field}">{prop.name}</label>
            <ImageSelect imageUrl={document[field]} {prop} />
            {:else if isMarkdown(prop)}
            <span class="colspan">
                <MarkdownEditor value={document[field] ?? ''}
                    on:blur={({ detail }) => update(detail, field)} />
            </span>
            {:else if prop.dataType === 'string'}
            <label for="{field}">{prop.name}</label>
            <input type="text" {disabled} id="{field}" 
                value="{document[field] ?? ''}" 
                on:input={(ev) => updateInput(ev, field)} />
            {:else if prop.dataType === 'number'}
            <label for="{field}">{prop.name}</label>
            <input type="number" {disabled} id="{field}" 
                value="{document[field] ?? ''}" 
                on:input={(ev) => updateInput(ev, field)} />
            {:else if prop.dataType === 'date'}
            <label for="{field}">{prop.name}</label>
            <input type="datetime-local" {disabled} id="{field}" 
                value="{isoToLocal(field)}" 
                on:input={(ev) => updateInput(ev, field)} />
            {:else if prop.dataType === 'map'}
            <Expand>
                <span slot="header" class="emphasis no-wrap center">{prop.name}</span>
                <div class="indent">
                    <svelte:self document="{document[field]}" properties="{prop.properties}"
                        on:update={({ detail }) => updateNested(document[field], detail, field)} />
                </div>
            </Expand>
            {:else}
            <pre id="{field}" class="colspan">{JSON.stringify(prop, null, 2)}</pre>
            {/if}
        </div>
    </li>
    {/each}
</ul>
{:else}
    <span class="emphasis">error parsing properties</span>
    <pre>{JSON.stringify(properties, null, 2)}</pre>
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