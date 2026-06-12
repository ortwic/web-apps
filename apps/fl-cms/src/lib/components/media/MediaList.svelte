<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { StorageItem } from "../../models/storage.type";

    export let items: StorageItem[] = [];

    type EventArgs = {
        folderClick: string;
        fileClick: StorageItem;
        previewClick: StorageItem;
        deleteClick: StorageItem;
    };

    const dispatch = createEventDispatcher<EventArgs>();
</script>

<div class="grid">
    {#each items as item (item.path)}
    {#if item.type !== 'file'}
    <span class="no-wrap colspan">
        <i class="bx bx-{item.type === 'virtual' ? 'folder-plus' : 'folder'}"></i> 
        <a href="#/" on:click|preventDefault={() => dispatch('folderClick', item.path)}>{item.name}</a>
    </span>
    {:else}
    <span class="no-wrap">
        <i class="bx bx-file"></i> 
        <a href="#/" on:click|preventDefault={() => dispatch('fileClick', item)}> {item.name}</a>
    </span>
    <span>
        <button class="icon clear" on:click|preventDefault={async () => dispatch('previewClick', item)}>
            <i class="bx bx-search"></i>
        </button>
        <button class="icon clear" on:click|preventDefault={() => dispatch('deleteClick', item)}>
            <i class="bx bx-trash"></i>
        </button>
    </span>
    {/if}
    {/each}
</div>

<style lang="scss">
    .grid {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 0 1rem;

        .colspan {
            grid-column: 1 / span 2;
        }
    }
</style>