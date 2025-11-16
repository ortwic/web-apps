<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { of } from 'rxjs';
  import { normalizePath, trimSlashes } from '../../utils/string.helper';

  const dispatch = createEventDispatcher();

  export let path = of('');
  export let rootLabel: string = 'Index';
  export let rootPath: string = '';
  export let separator: string = '/';

  $: segments = normalizePath($path)?.split('/').filter(Boolean) ?? [];

  // build hrefs for each segment: accumulate with leading '/'
  $: hrefs = segments.map((_, i) => `${rootPath}/${segments.slice(0, i + 1).map(encodeURIComponent).join('/')}`);

  function navigate(href: string) {
      dispatch('navigate', trimSlashes(href));
  }
</script>

{#if path}
<nav class="breadcrumb" aria-label="Breadcrumb">
  <ol>
    {#if rootLabel}
      <li class="crumb">
        {#if segments.length}
          <a href="/" on:click|preventDefault={e => navigate('/')} aria-label="{rootLabel}">
            {rootLabel}
          </a>
        {:else}
          <span class="current" aria-current="page">{rootLabel}</span>
        {/if}
        {#if segments.length}
          <span class="sep" aria-hidden>{separator}</span>
        {/if}
      </li>
    {/if}

    {#each segments as seg, i}
      <li class="crumb">
        {#if i < segments.length - 1}
          <a href={hrefs[i]} on:click|preventDefault={e => navigate(hrefs[i])}>
            {@html decodeURIComponent(seg)}
          </a>
        {:else}
          <span class="current" aria-current="page">{@html decodeURIComponent(seg)}</span>
        {/if}

        {#if i < segments.length - 1}
          <span class="sep" aria-hidden>{separator}</span>
        {/if}
      </li>
    {/each}
  </ol>
</nav>
{/if}

<style>
  .breadcrumb ol {
    display: flex;
    list-style: none;
    padding: 0;
    margin: 0;
    align-items: center;
    flex-wrap: nowrap;
    overflow: auto;
  }

  .crumb {
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
  }

  .current {
    padding: 0.125rem 0.25rem;
  }

  .sep {
    text-indent: .2em;
    margin: 0 0.35rem;
  }
</style>
