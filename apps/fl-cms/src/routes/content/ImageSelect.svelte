<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { BehaviorSubject } from "rxjs";
    import type { AnyProperty, StringProperty } from "../../lib/packages/firecms_core/types/properties";
    import type { StorageFile } from "../../lib/models/storage.type";
    import Modal from "../../lib/components/Modal.svelte";
    import MediaBrowser from "../media/MediaBrowser.svelte";
    import Toolbar from "../../lib/components/Toolbar.svelte";
    import { confirmed } from "../../lib/utils/ui.helper";

    export let prop: AnyProperty;
    export let imageUrl: string;
    export let disabled = false;

    const dispatch = createEventDispatcher();
    let open = false;

    const storage = (prop as StringProperty).storage;
    const urlSubject = new BehaviorSubject(`${storage?.storagePath}`);
    const url$ = urlSubject.asObservable();

    function showDialog() {
        if (!disabled) {
            open = true;
        }
    }

    function select(item?: StorageFile) {
        imageUrl = item ? item.url : '';
        dispatch('selected', item ?? { url: '' });
    }
</script>

<button {disabled} on:click={showDialog}>
{#if imageUrl}
<img src="{imageUrl}" class="preview" alt="{prop.name}" />
{:else}
<span>None</span>
{/if}
</button>

<Modal {open} on:close={() => open = false}>
    <div class="x-grid">
        {#if imageUrl}
        <img src="{imageUrl}" class="preview" alt="{prop.name}" />
        {:else}
        <button class="preview">None</button>
        {/if}
        <span class="y-grid">
            <Toolbar width="100%">
                <button class="icon clear" title="Remove" on:click={() => select()}>
                    <i class="bx bx-trash danger"></i>
                </button>
                <span slot="title">Select image from library</span>
            </Toolbar>
            <textarea title="Image URL" on:keyup={(ev) => confirmed(ev) && select()}>{imageUrl}</textarea>
        </span>
        <div class="colspan">
            <MediaBrowser path={url$} 
                on:fileSelect={({ detail: item }) => select(item)}
                on:folderChange={({ detail: url }) => urlSubject.next(url)} />
        </div>
    </div>
</Modal>

<style lang="scss">
    .preview {
        min-width: 12em;
    }

    .x-grid {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 1rem;

        .colspan {
            grid-column: 1 / span 2;
        }
    }

    .y-grid {
        display: grid;
        grid-template-rows: auto 1fr;
        gap: 1rem;
    }
</style>