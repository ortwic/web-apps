<script lang="ts">
  import { params, push } from "svelte-spa-router";
  import MediaBrowser from "./MediaBrowser.svelte";
  import ImagePreview from "./ImagePreview.svelte";
  import type { StorageFile } from "../../lib/models/storage.type";

  $: path = $params?.wild;

  let preview: StorageFile | undefined;
</script>

<MediaBrowser {path} 
    on:change={({ detail }) => push(`/media/${detail}`)} 
    on:select={({ detail }) => preview = detail}/>

<ImagePreview src={preview?.url} name={preview?.name} />