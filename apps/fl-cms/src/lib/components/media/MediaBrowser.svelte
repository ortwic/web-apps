<script lang="ts">
    import { createEventDispatcher, tick } from "svelte";
    import { combineLatest, of, switchMap, tap } from "rxjs";
    import type { StorageFile, StorageItem } from "../../models/storage.type";
    import { currentClientUser } from "../../stores/app.store";
    import { currentStorage } from "../../stores/storage/storage.service";
    import { fromStore } from "../../utils/rx.store";
    import { confirmed } from "../../utils/input.helper";
    import Breadcrumb from "../ui/Breadcrumb.svelte";
    import Loading from "../ui/Loading.svelte";
    import Modal from "../ui/Modal.svelte";
    import Toolbar from "../ui/Toolbar.svelte";
    import ImagePreview from "./ImagePreview.svelte";
    import MediaList from "./MediaList.svelte";
    import MediaGrid from "./MediaGrid.svelte";

    $: disabled = !$currentClientUser;

    export let path = of('');

    type ViewMode = 'list' | 'grid';
    type EventArgs = { folderChange: string; fileSelect: StorageFile; };

    const dispatch = createEventDispatcher<EventArgs>();

    let viewMode: ViewMode = 'list';
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

    function toggleViewMode() {
        viewMode = viewMode === 'list' ? 'grid' : 'list';
    }

    async function previewClicked(item: StorageItem) {
        preview = await withUrl(item);
    }

    function deleteClicked(item: StorageItem) {
        if (confirm('Delete?')) {
            $currentStorage.deleteFile(item.path);
        }
    }

    async function showPrompt() {
        promptVisible = true;
        
        await tick();
        prompt?.focus();
    }

    function createFolder(event: Event & { currentTarget: EventTarget & HTMLInputElement }) {
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

<header>
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
            <button
                class="icon clear"
                title="Toggle to {viewMode === 'list' ? 'grid' : 'list'} view"
                on:click={toggleViewMode}>
                <i class="bx bx-{viewMode === 'list' ? 'grid-alt' : 'list-ul'}"></i>
            </button>
        </span>
        <span slot="title">
            <Breadcrumb
                path={$path}
                rootLabel="Media"
                on:navigate={({ detail: path }) => folderClicked(path)} />
        </span>
    </Toolbar>
</header>

<section class="content-64">
    <Loading {isLoading} title={$path}>
        {#if viewMode === 'list'}
            <MediaList
                items={$items$}
                on:folderClick={({ detail }) => folderClicked(detail)}
                on:fileClick={({ detail }) => fileClicked(detail)}
                on:previewClick={({ detail }) => previewClicked(detail)}
                on:deleteClick={({ detail }) => deleteClicked(detail)} />
        {:else}
            <MediaGrid
                items={$items$}
                on:folderClick={({ detail }) => folderClicked(detail)}
                on:fileClick={({ detail }) => fileClicked(detail)}
                on:previewClick={({ detail }) => previewClicked(detail)}
                on:deleteClick={({ detail }) => deleteClicked(detail)} />
        {/if}
    </Loading>
</section>

<ImagePreview src={preview?.url} name={preview?.name} />

<Modal open={promptVisible} width="12em" on:close={() => promptVisible = false}>
    <p>
        <label for="folder-prompt">Enter folder name</label>
    </p>
    <input
        id="folder-prompt"
        type="text"
        bind:this={prompt}
        placeholder="Folder name"
        on:keyup={(ev) => confirmed(ev) && createFolder(ev)} />
</Modal>

<input type="file" bind:this={upload} on:change={uploadFile} accept="image/*" />

<style lang="scss">

    input[type="file"] {
        display: none;
    }
</style>