<script lang="ts">
    import { params, push } from 'svelte-spa-router';
    import { map } from 'rxjs';
    import { APP_TITLE } from '../app.info';
    import MediaBrowser from '../lib/components/media/MediaBrowser.svelte';
    import ImagePreview from '../lib/components/media/ImagePreview.svelte';
    import type { StorageFile } from '../lib/models/storage.type';
    import { fromStore } from '../lib/utils/rx.store';

    const path = fromStore(params).pipe(map((p) => p?.wild ?? ''));

    let preview: StorageFile | undefined;
</script>

<svelte:head>
    <title>{APP_TITLE} | Media</title>
</svelte:head>

<MediaBrowser
    {path}
    on:folderChange={({ detail }) => push(`/media/${detail}`)}
    on:fileSelect={({ detail }) => (preview = detail)}
/>

<ImagePreview src={preview?.url} name={preview?.name} />
