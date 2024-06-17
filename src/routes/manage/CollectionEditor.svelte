<script lang="ts">
    import { slide } from 'svelte/transition';
    import { Timestamp, DocumentReference, GeoPoint } from 'firebase/firestore';
    import type { DataType } from '@firecms/core';
    import { buildEntityPropertiesFromData } from '@firecms/schema_inference'
    import type { EntityCollection } from '$lib/models/schema.model';
    import { createStore } from '$lib/stores/firestore.store';

    export let item: EntityCollection;

    const dataTypeValues = ["string", "number", "boolean", "date", "array", "map", "geopoint", "reference"] as const;
    const collapsibleCodeBlocks: Record<string, boolean> = {};

    const currentStore = createStore<EntityCollection>(item.path);
    const documents = $currentStore.documents;
        
    async function doCollectionInference() {
        item.props = await buildEntityPropertiesFromData($documents, getType);
        console.log(item);
    }

    function getType(value: any): DataType {
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
    }

    function toggleCodeRow(key: string) {
        collapsibleCodeBlocks[key] = !collapsibleCodeBlocks[key];
    }
</script>

<section class="toolbar x-flex-full">
    <span class="corner">
        <button title="Add" disabled class="clear" on:click={doCollectionInference}>
            <i class="bx bx-save"></i>
        </button>
        <button title="Infer from data" class="clear" on:click={doCollectionInference}>
            <i class="bx bxs-magic-wand"></i>
        </button>
    </span>
    <h2 class="emphasis">{item.path}</h2>
    <span class="corner"></span>
</section>

<section class="table">
    <div class="cell header" title="Id">Id</div>
    <div class="cell header" title="Data Type">Data Type</div>
    <div class="cell header" title="Default Value">Default Value</div>
    <div class="cell header" title="Validation">Validation</div>
    <div class="cell header" title="Editable">Editable</div>
    <div class="cell"></div>

    {#each Object.keys(item.props) as key}
    <div class="cell x-flex-full">
        <span title="Id">{key}</span>
        {#if item.props[key].dataType === "array" || item.props[key].dataType === "map"}
            <button disabled class="clear">
                <i class="bx bx-chevron-down"></i>
            </button>
        {/if}
    </div>
    <div class="cell" title="Data Type">
        <select class="w-100" bind:value={item.props[key].dataType}>
            {#each dataTypeValues as type}
                <option value={type}>{type}</option>
            {/each}
        </select>
    </div>
    <div class="cell" title="Default Value">
        <input type="text" bind:value={item.props[key].defaultValue} placeholder="Default value">
    </div>
    <div class="cell" title="Validation">
        <input type="checkbox" checked={item.props[key].validation?.required}>
        <input type="text" value={item.props[key].validation?.requiredMessage ?? ''} placeholder="Required message">
    </div>
    <div class="cell" title="Editable"><input type="checkbox" bind:checked={item.props[key].editable}></div>
    <div class="cell">
        <button title="Show JSON" class="clear" on:click={() => toggleCodeRow(key)}>
            <i class="bx bx-code"></i>
        </button>
        <button title="Delete" disabled class="clear" on:click={doCollectionInference}>
            <i class="bx bx-trash"></i>
        </button>
    </div>
    {#if collapsibleCodeBlocks[key]}
        <div class="cell full" in:slide={{ duration: 200 }} out:slide={{ duration: 200 }}>
            <pre>{JSON.stringify(item.props[key], null, 2)}</pre>
        </div>
    {/if}
    {/each}
</section>

<style>
    .toolbar > .corner {
        min-width: 10%;
    }

    .table {
        display: grid;
        grid-template-columns: repeat(6, auto);
    }

    .cell {
        padding: .4rem .8rem;
    }

    .cell.header {
        font-weight: bold;
        border-bottom: 1px solid var(--color-theme-2);
    }

    .cell.full {
        grid-column: 1 / -1;
    }

    button {
        padding: .2rem;
    }
</style>
