<script lang="ts">
    import type { AnyProperty, StringProperty } from "../../lib/packages/firecms_core/types/properties";
    import Modal from "../../lib/components/Modal.svelte";

    export let prop: AnyProperty;
    export let imageUrl: string;
    let open = false;

    const storage = (prop as StringProperty).storage;

    function relativeUrl() {
        try {
            const url = new URL(imageUrl);
            const file = url.pathname.split('/').pop();
            return file && decodeURIComponent(file) || imageUrl;
        } catch (error) {
            console.warn(error);
        }
        return storage?.storagePath;
    }
</script>

{#if imageUrl}
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<img src="{imageUrl}" class="preview" alt="{prop.name}" 
    on:click={() => open = true} on:keypress={() => open = true}
/>
{:else}
<button on:click={() => open = true}>None</button>
{/if}

<Modal {open} on:close={() => open = false}>
    <h2>Edit {prop.name}</h2>
    <div class="grid">
        <label for="storage">Storage path</label>
        <input id="storage" disabled value={storage?.storagePath} />
        <label for="rel">Relative path</label>
        <input id="rel" value={relativeUrl()} />
        <label for="path">Absolute path</label>
        <textarea id="path">{imageUrl}</textarea>
    </div>
</Modal>

<style>
    img {
        cursor: pointer;
        transition: all .25 ease-in-out;
    }

    img:hover {
        outline: 2px solid var(--color-theme-1);
    }

    .grid {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 1rem;

    }
</style>