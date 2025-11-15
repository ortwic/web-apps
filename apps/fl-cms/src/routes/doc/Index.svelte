<script lang="ts">
  import { params, push } from "svelte-spa-router";
  import { map } from "rxjs";
  import { fromStore } from "../../lib/utils/rx.store";
  import List from "./list/Collection.svelte";
  import Content from "./content/Document.svelte";

  type PathInfo = {
    type: 'Collection' | 'Document';
    path: string;
    id?: string;
  };

  const pathInfo = fromStore(params)
    .pipe(map((p) => parsePath(p?.wild)));

  function parsePath(wild: string | undefined): PathInfo | undefined {
    const segments = wild?.split('/') || [];
    if (segments.length > 0) {
      if (segments.length % 2 !== 0) {
        return {
          type: 'Collection',
          path: segments.join('/')
        }
      }
      return {
        type: 'Document',
        id: segments.pop(),
        path: segments.join('/')
      };
    }
  }
</script>

<svelte:head>
    <title>Firebase CMS | {$pathInfo?.type}</title>
</svelte:head>

{#if $pathInfo?.type === 'Collection'}
  <List path={pathInfo.pipe(map(p => p?.path ?? ''))} />
{:else if $pathInfo?.type === 'Document'}
  <Content path={pathInfo.pipe(map(p => p?.path ?? ''))} 
           id={pathInfo.pipe(map(p => p?.id ?? ''))} 
  />
{/if}