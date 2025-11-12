<script lang="ts">
  import { Editor as MarkdownEditor } from "bytemd";
  import { createEventDispatcher } from "svelte";
  import type { DocumentData } from "firebase/firestore";
  import type { AnyProperty } from "../../lib/packages/firecms_core/types/properties";
  import { currentClientUser } from "../../lib/stores/app.store";
  import { timestampToIsoDate } from "../../lib/stores/db/firestore.store";
  import { confirmed } from "../../lib/utils/keyboard.helper";
  import Expand from '../../lib/components/Expand.svelte';
  import { isImageUrl, isMarkdown, mergeObject } from "../../lib/models/content.helper";
  import ImageSelect from "./ImageSelect.svelte";
  
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

  function addEntry(event: Event & { currentTarget: EventTarget & HTMLInputElement; }, field: string) {
    if (Array.isArray(document[field])) {
        document[field].push(event.currentTarget.value);
        update(document[field], field);
        event.currentTarget.value = '';
    }
  }
  
  function updateEntry(event: Event & { currentTarget: EventTarget & HTMLInputElement; }, field: string, index: number) {
    if (Array.isArray(document[field])) {
        if (!event.currentTarget.value) {
            // remove
            document[field].splice(index, 1);
        } else {
            // update
            document[field][index] = event.currentTarget.value;
        }
        update(document[field], field);
    }
  }

</script>

{#if typeof properties === 'object'}
<ul>
    {#each Object.entries(properties) as [field, prop]}
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
            {:else if isMarkdown(prop)}
            <span class="colspan">
                <MarkdownEditor value={document[field] ?? ''} placeholder={prop.name}
                    on:change={({ detail }) => update(detail['value'], field)} />
            </span>
            {:else}
                <label for="{field}">{prop.name ?? field}</label>
                {#if isImageUrl(prop)}
                <ImageSelect imageUrl={document[field]} {prop} />
                {:else if prop.dataType === 'string'}
                <input type="text" {disabled} id="{field}" 
                    value="{document[field] ?? ''}" 
                    on:input={(ev) => updateInput(ev, field)} />
                {:else if prop.dataType === 'boolean'}
                <input type="checkbox" {disabled} id="{field}" 
                    checked="{document[field] ?? false}" 
                    on:input={(ev) => updateInput(ev, field)} />
                {:else if prop.dataType === 'number'}
                <input type="number" {disabled} id="{field}" 
                    value="{document[field] ?? ''}" 
                    on:input={(ev) => updateInput(ev, field)} />
                {:else if prop.dataType === 'date'}
                <input type="datetime-local" {disabled} id="{field}" 
                    value="{isoToLocal(field)}" 
                    on:input={(ev) => updateInput(ev, field)} />
                {:else if prop.dataType === 'array'}
                <div class="y-flex">
                    {#if Array.isArray(document[field])}
                        {#each document[field] as item, i}
                        <input type="text" {disabled} id="{field}" value="{item}" 
                            title="Delete text to remove entry"
                            on:keyup={(ev) => confirmed(ev) && updateEntry(ev, field, i)}
                            on:blur={(ev) => updateEntry(ev, field, i)} />
                        {/each}
                    
                        <input type="text" {disabled} id="{field}" placeholder="Add new item"
                            on:keyup={(ev) => confirmed(ev) && addEntry(ev, field)} />
                    {/if}                
                </div>
                {:else}
                <span>
                    <pre id="{field}" class="colspan">{JSON.stringify(document[field], null, 2)}</pre>
                </span>
                {/if}
            {/if}
        </div>
    </li>
    {/each}
</ul>
{:else}
    <h2 class="emphasis">error parsing properties</h2>
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