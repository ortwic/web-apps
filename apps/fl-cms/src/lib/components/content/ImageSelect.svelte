<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { from, of } from "rxjs";
    import type { StorageConfig } from "../../packages/firecms_core/types/properties.simple";
    import type { StorageFile } from "../../models/storage.type";
    import { currentStorage } from "../../stores/storage/storage.service";
    import { isRelativeUrl } from "../../utils/string.helper";
    import ImageDialog from "../media/ImageDialog.svelte";
    import Input from "../ui/Input.svelte";
    
    export let value: string;
    export let storage: StorageConfig | undefined = undefined;
    export let disabled = false;
    export let alt = '';

    const dispatch = createEventDispatcher<{ changed: string }>();
    const url$ = isRelativeUrl(value) ? from($currentStorage.getFileUrl(value)) : of(value);
    let open = false;

    function showDialog() {
        if (!disabled) {
            open = true;
        }
    }

    function select(storage: StorageConfig, item?: StorageFile) {
        if (item) {
            value = item.url;
            dispatch('changed', storage.storeUrl ? item.url : item.path);
        } else {
            value = '';
            dispatch('changed', '');
        }
    }

    function update(url: string) {
        value = url;
        dispatch('changed', url);
    }
</script>

{#if storage}
<button {disabled} on:click={showDialog}>
    {#if value}
    <img src={$url$} {alt} class="preview" />
    {:else}
    <span>None</span>
    {/if}
</button>

<ImageDialog {open} path={`${storage?.storagePath}`} value={$url$} on:close={() => open = false}
    on:select={({ detail: item }) => select(storage, item)} on:remove={() => select(storage)}/>
{:else}
<span>
    {#if value}
    <img src={value} {alt} class="preview" />
    <Input type="url" {value} placeholder={alt} on:changed={({ detail }) => update(detail)}/>
    {:else}
    <span>None</span>
    {/if}
</span>
{/if}

<style lang="scss">
    button {
        padding: 0;
    }
</style>