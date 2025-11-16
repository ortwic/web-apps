<script lang="ts">
    import { slide } from 'svelte/transition';
    import type { Properties } from '../../packages/firecms_core/types/properties';

    export let properties: Properties = {};
    const dataTypeValues = [
        "string", "number", "boolean", "date", "array", "map", "geopoint", "reference"
    ] as const;

    const collapsibleCodeBlocks: Record<string, boolean> = {};

    function toggleCodeRow(key: string) {
        collapsibleCodeBlocks[key] = !collapsibleCodeBlocks[key];
    }
</script>

<section class="table">
    <div class="cell header" title="Id">Id</div>
    <div class="cell header" title="Data Type">Data Type</div>
    <div class="cell header" title="Default Value">Default Value</div>
    <div class="cell header" title="Validation">Validation</div>
    <div class="cell header" title="Editable">Editable</div>
    <div class="cell"></div>

    {#each Object.keys(properties) as key}
    <div class="cell x-flex-full">
        <span title="Id">{key}</span>
        {#if properties[key].dataType === "array" || properties[key].dataType === "map"}
            <button disabled class="clear">
                <i class="bx bx-chevron-down"></i>
            </button>
        {/if}
    </div>
    <div class="cell" title="Data Type">
        <select disabled class="w-100" bind:value={properties[key].dataType}>
            {#each dataTypeValues as type}
                <option value={type}>{type}</option>
            {/each}
        </select>
    </div>
    <div class="cell" title="Default Value">
        <input disabled type="text" bind:value={properties[key].defaultValue} placeholder="Default value">
    </div>
    <div class="cell" title="Validation">
        <input disabled type="checkbox" checked={properties[key].validation?.required}>
        <input disabled type="text" value={properties[key].validation?.requiredMessage ?? ''} placeholder="Required message">
    </div>
    <div class="cell" title="Editable">
        <input disabled type="checkbox" bind:checked={properties[key].editable}>
    </div>
    <div class="cell">
        <button title="Show JSON" class="clear" on:click={() => toggleCodeRow(key)}>
            <i class="bx bx-code"></i>
        </button>
    </div>
    {#if collapsibleCodeBlocks[key]}
        <div class="cell full" in:slide={{ duration: 200 }} out:slide={{ duration: 200 }}>
            <pre>{JSON.stringify(properties[key], null, 2)}</pre>
        </div>
    {/if}
    {/each}
</section>

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