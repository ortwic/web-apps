<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { StorageItem } from "../../models/storage.type";
    import { fileUrl } from "../../directives/file-url.action";

    export let items: StorageItem[] = [];

    type EventArgs = {
        folderClick: string;
        fileClick: StorageItem;
        previewClick: StorageItem;
        deleteClick: StorageItem;
    };

    const dispatch = createEventDispatcher<EventArgs>();

    const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif']);

    function isImage(name: string): boolean {
        const ext = name.split('.').pop()?.toLowerCase() ?? '';
        return IMAGE_EXTENSIONS.has(ext);
    }

    $: folders = items.filter(i => i.type !== 'file');
    $: files = items.filter(i => i.type === 'file');
</script>

<div class="media-grid-wrapper">
    {#if folders.length}
        <ul class="folder-list">
            {#each folders as folder (folder.path)}
                <li class="folder-row">
                    <i class="bx bx-{folder.type === 'virtual' ? 'folder-plus' : 'folder'}"></i>
                    <a href="#/" on:click|preventDefault={() => dispatch('folderClick', folder.path)}>
                        {folder.name}
                    </a>
                </li>
            {/each}
        </ul>
    {/if}

    {#if files.length}
        <ul class="tile-grid">
            {#each files as file (file.path)}
                <li class="tile">
                    <button
                        class="tile-preview"
                        title="Select {file.name}"
                        on:click|preventDefault={() => dispatch('fileClick', file)}>
                        {#if isImage(file.name)}
                            <img use:fileUrl={file.path}
                                alt={file.name}
                                loading="lazy"
                                style="content-visibility: auto" />
                        {:else}
                            <span class="file-icon">
                                <i class="bx bx-file bx-lg"></i>
                            </span>
                        {/if}
                    </button>
                    <div class="tile-footer">
                        <span class="tile-name" title={file.name}>{file.name}</span>
                        <span class="tile-actions">
                            <button class="icon clear" title="Preview"
                                on:click|preventDefault={() => dispatch('previewClick', file)}>
                                <i class="bx bx-search"></i>
                            </button>
                            <button class="icon clear" title="Delete"
                                on:click|preventDefault={() => dispatch('deleteClick', file)}>
                                <i class="bx bx-trash"></i>
                            </button>
                        </span>
                    </div>
                </li>
            {/each}
        </ul>
    {/if}
</div>

<style lang="scss">
    .media-grid-wrapper {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    // Folders bleiben als kompakte Liste
    .folder-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0;
    }

    .folder-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.4rem 0.5rem;
        border-bottom: 1px solid silver;
        font-weight: 500;
        transition: background-color 0.15s ease;

        &:last-child {
            border-bottom: none;
        }

        &:hover {
            background-color: var(--primghost);
        }

        i {
            color: var(--textghost);
            flex-shrink: 0;
        }
    }

    // Kacheln
    .tile-grid {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 0.75rem;
    }

    .tile {
        display: flex;
        flex-direction: column;
        border: 1px solid var(--color-bg-0);
        border-radius: 6px;
        overflow: hidden;
        background-color: var(--primback);
        transition: box-shadow 0.15s ease;

        &:hover {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);

            .tile-actions {
                opacity: 1;
            }
        }
    }

    .tile-preview {
        all: unset;
        cursor: pointer;
        display: block;
        width: 100%;
        aspect-ratio: 1 / 1;
        overflow: hidden;
        background-color: var(--primghost);

        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }

        .file-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            color: var(--textghost);
        }
    }

    .tile-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.25rem;
        padding: 0.3rem 0.4rem;
        border-top: 1px solid var(--color-bg-0);
        min-width: 0;
    }

    .tile-name {
        font-size: 0.75rem;
        color: var(--text);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 1;
        min-width: 0;
    }

    .tile-actions {
        display: flex;
        align-items: center;
        flex-shrink: 0;
        opacity: 0;
        transition: opacity 0.15s ease;
    }
</style>