<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { BehaviorSubject } from "rxjs";
    import Modal from "../ui/Modal.svelte";
    import Toolbar from "../ui/Toolbar.svelte";
    import type { StorageFile } from "../../models/storage.type";
    import { confirmed } from "../../utils/ui.helper";
    import MediaBrowser from "./MediaBrowser.svelte";

    export let path: string | undefined;
    export let value = '';
    export let name = '';
    export let open = false;

    const dispatch = createEventDispatcher<{ select: StorageFile; remove: void; close: void }>();
    const urlSubject = new BehaviorSubject(path ?? '');
    const url$ = urlSubject.asObservable();
</script>

<Modal {open} on:close={() => dispatch('close')}>
    <div class="x-grid">
        {#if value}
        <img src="{value}" class="preview" alt="{name}" />
        {:else}
        <button class="preview">None</button>
        {/if}
        <span class="y-grid">
            <Toolbar width="100%">
                <button class="icon clear" title="Remove" on:click={() => dispatch('remove')}>
                    <i class="bx bx-trash danger"></i>
                </button>
                <span slot="title">Select image from library</span>
            </Toolbar>
            <textarea title="Image URL" on:keyup={(ev) => confirmed(ev) && dispatch('remove')}>{value}</textarea>
        </span>
        <div class="colspan">
            <MediaBrowser path={url$} 
                on:fileSelect={({ detail }) => dispatch('select', detail)}
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