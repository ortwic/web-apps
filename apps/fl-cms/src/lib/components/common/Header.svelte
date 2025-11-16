<script lang="ts">
    import { derived } from 'svelte/store';
    import { link, location, querystring } from "svelte-spa-router";
    import { settingsStore } from '../../stores/settings.store';
    import { getInitials } from '../../utils/string.helper';
  
    const pathStartsWith = derived(location, l => l.split('/').filter(Boolean).at(0));
    const title = derived(settingsStore, s => getInitials(s.selectedProjectId));
    const returnUrl = window.location.hash ? `?returnUrl=${window.location.hash.substring(1)}` : '';
    const targetUrl = derived(querystring, q => q?.split('returnUrl=')[1] ?? '/');
</script>

<header>
    {#if $pathStartsWith !== 'settings' || !$settingsStore.selectedProjectId}
        <a use:link href="/settings{returnUrl}"><i class="bx bx-cog"></i></a>
    {:else}
        <a use:link href="{$targetUrl}" class="circle">
            <span class="title">{$title}</span>
        </a>
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
        font-size: 0.8rem;
        text-decoration: none;
        text-shadow: 0 0 1px black;
    }

    .circle {
        display: block;
        width: 1.7rem;
        height: 2rem;
        margin: .4rem;
        border-radius: 50%;
        color: var(--color-theme-1);
        border: 1px solid var(--color-bg-1);
        background-color: var(--color-bg-2);
        transition: border .25 ease-in-out;
        text-align: center;
    }

    .circle:hover {
        border-color: var(--color-theme-1);
    }

    .title {
        display: flex;
        justify-content: center;
        align-items: center;
        position: absolute;
        top: 0;
        right: 0;
        bottom: 4%;
        left: 0;
    }
</style>
