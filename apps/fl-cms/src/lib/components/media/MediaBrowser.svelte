<script lang="ts">
    import { createEventDispatcher, tick } from "svelte";
    import { combineLatest, of, switchMap, tap } from "rxjs";
    import type { StorageFile, StorageItem } from "../../models/storage.type";
    import { currentClientUser } from "../../stores/app.store";
    import { currentStorage } from "../../stores/storage/storage.service";
    import { fromStore } from "../../utils/rx.store";
    import { confirmed } from "../../utils/ui.helper";
    import Breadcrumb from "../ui/Breadcrumb.svelte";
    import Loading from "../ui/Loading.svelte";
    import Modal from "../ui/Modal.svelte";
    import Toolbar from "../ui/Toolbar.svelte";
    import ImagePreview from "./ImagePreview.svelte";

    $: disabled = !$currentClientUser;
    
    export let path = of('');

    type EventArgs = { folderChange: string; fileSelect: StorageFile; };
    const dispatch = createEventDispatcher<EventArgs>();

    let preview: StorageFile | undefined;
    let upload: HTMLInputElement;
    let prompt: HTMLInputElement;
    let promptVisible = false;
    let isLoading = true;

    const items$ = combineLatest([
        fromStore(currentStorage), 
        path.pipe(tap(() => isLoading = true))
    ]).pipe(
        switchMap(([storage, path]) => storage.listAll(path)),
        tap(() => isLoading = false)
    );

    async function folderClicked(path: string) {
        dispatch('folderChange', path);
    }

    async function fileClicked(item: StorageItem) {
        dispatch('fileSelect', await withUrl(item));
    }
    
    async function withUrl(item: StorageItem): Promise<StorageFile> {
        const url = await $currentStorage.getFileUrl(item.path);
        return { ...item, url };
    }

    async function showPrompt() {
        promptVisible = true;

        await tick();
        prompt?.focus();
    }

    function createFolder(event: Event & { currentTarget: EventTarget & HTMLInputElement; }) {
        $currentStorage.createFolder($path, event.currentTarget.value);
        promptVisible = false;
    }

    function selectFile() {
        // ensure onchange fires for same file again
        upload.value = '';
        upload.click();
    }

    async function uploadFile() {
        if (upload.files?.length) {
            const file = upload.files[0];
            await $currentStorage.uploadFile($path, file);
        }
    }
    
</script>

<section class="content-64">
    <Toolbar width="100%">
        <span class="no-wrap">
            <button {disabled} class="icon clear" title="Create folder"
                on:click|preventDefault={showPrompt}>
                <i class="bx bx-folder-plus"></i>
            </button>
            <button {disabled} class="icon clear" title="Upload file"
                on:click|preventDefault={selectFile}>
                <i class="bx bx-upload"></i>
            </button>
        </span>
        <span slot="title">
            <Breadcrumb {path} rootLabel="Media" on:navigate={({ detail: path }) => folderClicked(path)} />
        </span>
    </Toolbar>
    
    <Loading {isLoading}>
        <div class="grid">
            {#each $items$ as item (item.path)}
            {#if item.type !== 'file'}
            <span class="no-wrap colspan">
                <i class="bx bx-{item.type === 'virtual' ? 'folder-plus' : 'folder'}"></i> 
                <a href="#/" on:click|preventDefault={() => folderClicked(item.path)}>{item.name}</a>
            </span>
            {:else}
            <span class="no-wrap">
                <i class="bx bx-file"></i> 
                <a href="#/" on:click|preventDefault={() => fileClicked(item)}> {item.name}</a>
            </span>
            <span>
                <button class="icon clear" on:click|preventDefault={async () => preview = await withUrl(item)}>
                    <i class="bx bx-search"></i>
                </button>
                <button class="icon clear" on:click|preventDefault={() => confirm('Delete?') && $currentStorage.deleteFile(item.path)}>
                    <i class="bx bx-trash"></i>
                </button>
            </span>
            {/if}
            {/each}
        </div>
    </Loading>
    
</section>

<ImagePreview src={preview?.url} name={preview?.name} />

<Modal open={promptVisible} width="12em" on:close={() => promptVisible = false}>
    <p>
        <label for="prompt">Enter folder name</label>
    </p>
    <input id="prompt" type="text" bind:this={prompt} placeholder="Folder name" 
        on:keyup={(ev) => confirmed(ev) && createFolder(ev)}>
</Modal>

<input type="file" bind:this={upload} on:change="{uploadFile}" accept="image/*" />

<style lang="scss">
    .grid {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 0 1rem;

        .colspan {
            grid-column: 1 / span 2;
        }
    }

    input[type="file"] {
        display: none;
    }
</style>