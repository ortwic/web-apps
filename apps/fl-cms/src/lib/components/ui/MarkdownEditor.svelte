<script lang="ts">
    import 'bytemd/dist/index.css';
    import { Editor, Viewer } from 'bytemd'
    import { createEventDispatcher } from 'svelte';
    import ImageSelectDialog from '../media/ImageDialog.svelte';
    import { currentStorage } from '../../stores/storage/storage.service';
    import { imageSelectPlugin, resolveImagesPlugin } from '../../extensions/bytemd.plugins';

    export let value = '';
    export let placeholder = '';
    export let disabled = false;
    export let mediaPath = '';
    export let storeUrl = false;

    let imageSelect: ImageSelectDialog;
    let showImageSelector = false;

    const dispatch = createEventDispatcher<{ change: string }>();

    function selectImage(): Promise<string> {
        showImageSelector = true;

        return new Promise<string>((resolve) => {
            imageSelect.$on('select', ({ detail: item }) => {
                showImageSelector = false;
                resolve(storeUrl ? item.url : item.path);
            });
            imageSelect.$on('close', () => {
                showImageSelector = false;
                resolve('');
            });
        });
    }
</script>

{#if disabled}
<div class="input">
    <Viewer {value} plugins={[resolveImagesPlugin($currentStorage)]}/>
</div>
{:else}
<Editor {value} {placeholder}
    plugins={[imageSelectPlugin(selectImage), resolveImagesPlugin($currentStorage)]} 
    on:change={({ detail }) => dispatch('change', detail['value'])}/>

<ImageSelectDialog bind:this={imageSelect} open={showImageSelector} path={mediaPath} />
{/if}