<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { currentStorage } from "../../lib/stores/storage/storage.service";
    import type { StorageFile, StorageItem } from "../../lib/models/storage.type";
    import Breadcrumb from "../../lib/components/Breadcrumb.svelte";
    import Toolbar from "../../lib/components/Toolbar.svelte";
    import ImagePreview from "./ImagePreview.svelte";

    export let path = '';

    const dispatch = createEventDispatcher();
    let preview: StorageFile | undefined;

    async function selectFolder(path: string) {
        dispatch('change', path);
    }

    async function selectFile(item: StorageItem) {
        dispatch('select', await withUrl(item));
    }
    
    async function withUrl(item: StorageItem): Promise<StorageFile> {
        const url = await $currentStorage.getFileUrl(item.path);
        return { ...item, url };
    }
    
</script>

<section class="content-64">
    <Toolbar width="100%">
        <span class="no-wrap">
            <button class="icon clear" title="Create folder">
                <i class="bx bx-folder-plus"></i>
            </button>
            <button class="icon clear" title="Upload file">
                <i class="bx bx-upload"></i>
            </button>
        </span>
        <span slot="title">
            <Breadcrumb {path} rootLabel="Media" on:navigate={({ detail: path }) => selectFolder(path)} />
        </span>
    </Toolbar>
    {#await $currentStorage.listAll(path)}
    <i class="bx bx-loader bx-spin"></i>
    {:then items}
    <ul>
        {#each items as item}
        {#if item.type === 'folder'}
        <li class="no-wrap">
            <i class="bx bx-folder"></i> <a href="#/" on:click|preventDefault={() => selectFolder(item.path)}>{item.name}</a>
        </li>
        {:else}
        <li class="no-wrap">
            <button class="icon clear" on:click|preventDefault={async () => preview = await withUrl(item)}>
                <i class="bx bx-search"></i>
            </button>
            <a href="#/" on:click|preventDefault={() => selectFile(item)}> {item.name}</a>
        </li>
        {/if}
        {/each}
    </ul>
    {/await}
</section>

<ImagePreview src={preview?.url} name={preview?.name} />

<style lang="scss">
    ul {
        list-style: none;
        padding: 0;

        .bx-file {
            color: var(--color-theme-1);
        }
    }
</style>