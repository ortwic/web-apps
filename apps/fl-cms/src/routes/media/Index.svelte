<script lang="ts">
  import { params, push } from "svelte-spa-router";
  import { map } from "rxjs";
  import MediaBrowser from "./MediaBrowser.svelte";
  import ImagePreview from "./ImagePreview.svelte";
  import type { StorageFile } from "../../lib/models/storage.type";
  import { fromStore } from "../../lib/utils/rx.store";

  const path = fromStore(params).pipe(map((p) => p?.wild ?? ''));

  let preview: StorageFile | undefined;
</script>

<svelte:head>
    <title>Firebase CMS | Media</title>
</svelte:head>

<MediaBrowser {path}
    on:change={({ detail }) => push(`/media/${detail}`)} 
    on:select={({ detail }) => preview = detail}/>

<ImagePreview src={preview?.url} name={preview?.name} />