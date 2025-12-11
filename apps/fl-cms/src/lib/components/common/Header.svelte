<script lang="ts">
    import { derived } from 'svelte/store';
    import { link, location, querystring } from "svelte-spa-router";
    import { settingsStore } from '../../stores/settings.store';
  
    const pathStartsWith = derived(location, l => l.split('/').filter(Boolean).at(0));

    $: targetUrl = $querystring?.split('return=')[1] ?? '/';
    $: targetIcon = targetUrl.length > 1 ? 'bx-arrow-back' : 'bxs-grid';
</script>

<header>
    {#if $pathStartsWith !== 'settings' || !$settingsStore.selectedProjectId}
        <a use:link href="/settings?return={$location}"><i class="bx bx-cog"></i></a>
    {:else}
        <a use:link href="{targetUrl}"><i class="bx {targetIcon}"></i></a>
    {/if}
</header>

<style>
    header {
        position: fixed;
        z-index: 100;
        right: 0;
        top: 0;
        height: 3em;
        display: flex;
        justify-content: center;
        text-align: center;
    }

    a {
        display: flex;
        height: 100%;
        align-items: center;
        padding: 0 .2rem;
        color: var(--color-text);
        font-weight: 700;
        text-decoration: none;
        text-shadow: 0 0 1px black;
    }
</style>
