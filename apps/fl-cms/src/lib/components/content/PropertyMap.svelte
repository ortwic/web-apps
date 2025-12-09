<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { DocumentData } from 'firebase/firestore';
    import type { AnyProperty } from '../../packages/firecms_core/types/properties.simple';
    import {
        isFileType,
        isUrlProperty,
        isArrayProperty,
        isBlockSetProperty,
        mergeObject,
    } from '../../utils/content.helper';
    import { currentClientUser } from '../../stores/app.store';
    import { timestampToIsoDate } from '../../stores/db/firestore.helper';
    import Expand from '../ui/Expand.svelte';
    import MarkdownEditor from '../ui/MarkdownEditor.svelte';
    import TagCloud from '../ui/TagCloud.svelte';
    import Input from '../ui/Input.svelte';
    import JSONEditor from '../ui/JSONEditor.svelte';
    import Select from '../ui/Select.svelte';
    import ImageSelect from './ImageSelect.svelte';
    import SectionCards from './SectionCards.svelte';
    import DynamicMap from './DynamicMap.svelte';

    export let document: DocumentData;
    export let properties: Record<string, AnyProperty>;

    const dispatch = createEventDispatcher<{ 
        update: { data: Partial<DocumentData>, merge: boolean } 
    }>();

    $: disabled = !$currentClientUser;

    function isoToLocal(field: string) {
        try {
            const value = document[field];
            return timestampToIsoDate(value)?.slice(0, 16);
        } catch (error: any) {
            console.warn(`error parsing timestamp for field '${field}`, error.message);
        }
    }

    function update<T>(value: T, field: string, merge = true) {
        dispatch('update', { data: { [field]: value }, merge });
    }

    function updateInput(event: Event & { currentTarget: EventTarget & HTMLInputElement }, field: string) {
        dispatch('update', { data: { [field]: event.currentTarget.value }, merge: true });
    }

    function updateNested(old: object, value: object, field: string, merge: boolean) {
        if (old !== value) {
            dispatch('update', { data: { [field]: mergeObject(old, value) }, merge });
        }
    }
</script>

{#if document && typeof properties === 'object'}
    <div class="x-flex-full"><span></span><slot name="commands"></slot></div>
    <ul>
        {#each Object.entries(properties) as [field, prop]}
            {#if document[field] !== undefined}
                <li title={prop.dataType}>
                    {#if prop.dataType === 'map' && prop.keyValue}
                    <DynamicMap record={document[field]} title={prop.name ?? field}
                        on:update={({ detail }) => update(detail, field, false)}
                    />
                    {:else if prop.dataType === 'map'}
                    <Expand>
                        <span slot="header" class="emphasis no-wrap center">{prop.name ?? field}</span>
                        <div class="input">
                            <svelte:self
                                document={document[field]}
                                properties={prop.properties}
                                on:update={({ detail }) => updateNested(document[field], detail.data, field, detail.merge)}
                            />
                        </div>
                    </Expand>
                    {:else if prop.dataType === 'string' && prop.markdown === true}
                        <span class="colspan">
                            <MarkdownEditor
                                value={document[field] ?? ''}
                                {disabled}
                                placeholder={prop.name}
                                on:change={({ detail }) => update(detail, field)}
                            />
                        </span>
                    {:else}
                        <div class="grid">
                            <label for={field}>{prop.name ?? field}</label>
                            {#if isFileType(prop, 'image')}
                                <ImageSelect
                                    value={document[field]}
                                    alt={field}
                                    storage={prop.storage}
                                    disabled={disabled || prop.editable === false}
                                    on:changed={({ detail }) => update(detail, field)}
                                />
                            {:else if prop.dataType === 'string' && prop.enumValues != undefined}
                                <Select
                                    id={field}
                                    value={document[field] ?? ''}
                                    disabled={disabled || prop.editable === false}
                                    options={prop.enumValues}
                                    on:changed={({ detail }) => update(detail, field)}
                                />
                            {:else if isArrayProperty(prop, 'string')}
                                {#key document[field]}
                                    <TagCloud
                                        labels={document[field]}
                                        on:change={({ detail }) => update(detail, field)}
                                    />
                                {/key}
                            {:else if isArrayProperty(prop) || isBlockSetProperty(prop)}
                                <SectionCards
                                    property={prop}
                                    items={document[field]}
                                    on:change={({ detail }) => update(detail, field)}
                                />
                            {:else if prop.dataType === 'boolean'}
                                <input
                                    type="checkbox"
                                    id={field}
                                    disabled={disabled || prop.editable === false}
                                    checked={document[field] ?? false}
                                    on:input={(ev) => updateInput(ev, field)}
                                />
                            {:else if isUrlProperty(prop)}
                                <Input
                                    type="url"
                                    id={field}
                                    value={document[field]}
                                    disabled={disabled || prop.editable === false}
                                    on:changed={({ detail }) => update(detail, field)}
                                />
                            {:else if prop.dataType === 'string'}
                                <Input
                                    type="text"
                                    id={field}
                                    disabled={disabled || prop.editable === false}
                                    value={document[field] ?? ''}
                                    on:changed={({ detail }) => update(detail, field)}
                                />
                            {:else if prop.dataType === 'number'}
                                <Input
                                    type="number"
                                    id={field}
                                    disabled={disabled || prop.editable === false}
                                    value={document[field] ?? ''}
                                    on:changed={({ detail }) => update(detail, field)}
                                />
                            {:else if prop.dataType === 'date'}
                                <Input
                                    type="datetime-local"
                                    id={field}
                                    disabled={disabled || prop.editable === false}
                                    value={isoToLocal(field)}
                                    on:changed={({ detail }) => update(detail, field)}
                                />
                            {:else}
                                <Expand>
                                    <span slot="header" class="emphasis no-wrap center">{prop.name ?? field}</span>
                                    <JSONEditor
                                        value={document[field]}
                                        on:changed={({ detail }) => update(detail, field)}
                                    />
                                </Expand>
                            {/if}
                        </div>
                    {/if}
                </li>
            {/if}
        {/each}
    </ul>
{:else if !document}
    <h2 class="emphasis no-wrap">Missing data node</h2>
{:else}
    <h2 class="emphasis no-wrap">Unsupported data structure</h2>
    <pre>{JSON.stringify(document, null, 2)}</pre>
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
        padding: 0.6em 0;
        text-indent: 0.6em;
        border-left: 0.4em solid var(--color-bg-1);
    }
</style>
