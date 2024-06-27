<script lang="ts">
    import json from 'json5';
    import { slide } from 'svelte/transition';
    import { type Content, JSONEditor, Mode } from 'svelte-jsoneditor'
    import { Timestamp, DocumentReference, GeoPoint } from 'firebase/firestore';
    import type { Properties } from '$lib/packages/firecms_core/types/properties';
    import type { EntityCollection } from '$lib/models/schema.model';
    import { createSchemaStore, createStore } from '$lib/stores/firestore.store';
    import { showError, showInfo } from '$lib/stores/notification.store';
    import Toolbar from '$lib/components/Toolbar.svelte';

    export let item: EntityCollection;
    let showJsonView = false;
    $: content = { json: item.properties } as Content;

    const dataTypeValues = ["string", "number", "boolean", "date", "array", "map", "geopoint", "reference"] as const;
    const collapsibleCodeBlocks: Record<string, boolean> = {};

    const schemaStore = createSchemaStore();
    const currentStore = createStore(item.path);
    const documents = $currentStore.documents;

    async function saveCollection() {
        console.log(item.properties)
        try {
            await $schemaStore.setDocuments(item);
            showInfo(`${item.path} saved`);
        } catch (error) {
            showError(`${error}`);
        }
    }
        
    async function appendInferredPropsFromData() {
        const { buildEntityPropertiesFromData } = await import('$lib/packages/schema_inference');
        const getType = (value: any) => {
            if (typeof value === "number")
                return "number";
            else if (typeof value === "string")
                return "string";
            else if (typeof value === "boolean")
                return "boolean";
            else if (Array.isArray(value))
                return "array";
            else if (value instanceof Timestamp)
                return "date";
            else if (value instanceof GeoPoint)
                return "geopoint";
            else if (value instanceof DocumentReference)
                return "reference";
            return "map";
        };
        
        const inferredProps = await buildEntityPropertiesFromData($documents, getType);
        item.properties = { 
            ...item.properties, 
            ...inferredProps 
        };
    }

    function setProperties(content: Content) {
        if ('text' in content) {
            try {            
                item.properties = json.parse<Properties>(content.text);
            } catch (error) {
                showError(`Invalid JSON: ${error}`);
            }
        }
    }

    function toggleEditView() {
        showJsonView = !showJsonView;
    }

    function toggleCodeRow(key: string) {
        collapsibleCodeBlocks[key] = !collapsibleCodeBlocks[key];
    }
</script>

<Toolbar>
    <button title="Save properties" class="icon clear" on:click={saveCollection}>
        <i class="bx bx-save"></i>
    </button>
    <button title="Infer from data" class="icon clear" on:click={appendInferredPropsFromData}>
        <i class="bx bxs-magic-wand"></i>
    </button>
    <button title="Toggle code view" class="icon clear" on:click={toggleEditView}>
        <i class="bx {showJsonView ? 'bx-list-ul' : 'bx-code-curly'}"></i>
    </button>
    <span slot="title">{item.path}</span>
</Toolbar>

{#if showJsonView}
    <JSONEditor mainMenuBar={false} mode={Mode.text} {content} onChange={setProperties} />
{:else}
    <section class="table">
        <div class="cell header" title="Id">Id</div>
        <div class="cell header" title="Data Type">Data Type</div>
        <div class="cell header" title="Default Value">Default Value</div>
        <div class="cell header" title="Validation">Validation</div>
        <div class="cell header" title="Editable">Editable</div>
        <div class="cell"></div>
    
        {#each Object.keys(item.properties) as key}
        <div class="cell x-flex-full">
            <span title="Id">{key}</span>
            {#if item.properties[key].dataType === "array" || item.properties[key].dataType === "map"}
                <button disabled class="clear">
                    <i class="bx bx-chevron-down"></i>
                </button>
            {/if}
        </div>
        <div class="cell" title="Data Type">
            <select class="w-100" bind:value={item.properties[key].dataType}>
                {#each dataTypeValues as type}
                    <option value={type}>{type}</option>
                {/each}
            </select>
        </div>
        <div class="cell" title="Default Value">
            <input type="text" bind:value={item.properties[key].defaultValue} placeholder="Default value">
        </div>
        <div class="cell" title="Validation">
            <input type="checkbox" checked={item.properties[key].validation?.required}>
            <input type="text" value={item.properties[key].validation?.requiredMessage ?? ''} placeholder="Required message">
        </div>
        <div class="cell" title="Editable"><input type="checkbox" bind:checked={item.properties[key].editable}></div>
        <div class="cell">
            <button title="Show JSON" class="clear" on:click={() => toggleCodeRow(key)}>
                <i class="bx bx-code"></i>
            </button>
            <button title="Delete" disabled class="clear" on:click={appendInferredPropsFromData}>
                <i class="bx bx-trash"></i>
            </button>
        </div>
        {#if collapsibleCodeBlocks[key]}
            <div class="cell full" in:slide={{ duration: 200 }} out:slide={{ duration: 200 }}>
                <JSONEditor mainMenuBar={false} mode={Mode.text} content={{ json: item.properties[key] }} />
            </div>
        {/if}
        {/each}
    </section>
{/if}

<style>
    .table {
        display: grid;
        grid-template-columns: repeat(6, auto);
    }

    .cell {
        padding: .4rem .8rem;
        white-space: nowrap;
    }

    .cell.header {
        font-weight: bold;
        border-bottom: 1px solid var(--color-theme-2);
    }

    .cell.full {
        grid-column: 1 / -1;
    }
</style>
