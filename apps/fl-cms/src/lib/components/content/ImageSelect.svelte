<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { StorageConfig } from "../../packages/firecms_core/types/properties.simple";
    import type { StorageFile } from "../../models/storage.type";
    import ImageDialog from "../media/ImageDialog.svelte";

    export let storage = {} as StorageConfig;
    export let value: string;
    export let disabled = false;
    export let alt = '';

    const dispatch = createEventDispatcher<{ changed: string }>();
    let open = false;

    function showDialog() {
        if (!disabled) {
            open = true;
        }
    }

    function select(item?: StorageFile) {
        if (item) {
            value = item.url;
            dispatch('changed', storage.storeUrl ? item.url : item.path);
        } else {
            value = '';
            dispatch('changed', '');
        }
    }
</script>

<button {disabled} on:click={showDialog}>
{#if value}
<img src={value} {alt} class="preview" />
{:else}
<span>None</span>
{/if}
</button>

<ImageDialog {open} path={`${storage?.storagePath}`} {value} on:close={() => open = false}
    on:select={({ detail: item }) => select(item)} on:remove={() => select()}/>

<style lang="scss">
    button {
        padding: 0;
    }
</style>