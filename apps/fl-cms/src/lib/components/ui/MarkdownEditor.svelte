<script lang="ts">
    import 'bytemd/dist/index.css';
    import { Editor, Viewer } from 'bytemd'
    import { createEventDispatcher } from 'svelte';
    import ImageSelectDialog from '../media/ImageDialog.svelte';
    import { currentStorage } from '../../stores/storage/storage.service';
    import { imageSelectPlugin, resolveImagesPlugin } from '../../extensions/bytemd-images.plugins';
    import { purgeHtmlPlugin } from '../../extensions/bytemd-turndown.plugin';
    import { debounce } from '../../utils/input.helper';

    export let value = '';
    export let placeholder = '';
    export let disabled = false;
    export let mediaPath = '';
    export let storeUrl = false;
    export let debounceInMs = 500;

    let imageSelect: ImageSelectDialog;
    let showImageSelector = false;

    const dispatch = createEventDispatcher<{ changed: string }>();
	const handleChange = debounce((value) => dispatch("changed", value), debounceInMs);
    const viewerPlugins = [resolveImagesPlugin($currentStorage)];
    const editorPlugins = [
        imageSelectPlugin(selectImage), 
        resolveImagesPlugin($currentStorage),
        purgeHtmlPlugin()
    ];

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
    <Viewer {value} plugins={viewerPlugins}/>
</div>
{:else}
<Editor {value} {placeholder}
    plugins={editorPlugins} 
    on:change={({ detail }) => handleChange(detail['value'])}/>

<ImageSelectDialog bind:this={imageSelect} open={showImageSelector} path={mediaPath} />
{/if}