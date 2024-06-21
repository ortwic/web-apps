<script lang="ts">
    import { onMount } from 'svelte';
    import { derived } from 'svelte/store';
    import { slide } from 'svelte/transition';
    import { onAuthStateChanged } from 'firebase/auth';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { loadSettings, settingsStore } from '$lib/stores/settings.store';
    import { currentClientAuth, currentClientUser } from '$lib/stores/firebase.store';
    import Header from '$lib/components/Header.svelte';
    import Snackbar from '$lib/components/Snackbar.svelte';
    import '../styles/common.css';
    import '../styles/utils.css';

    const pathStartsWith = derived(page, p => p.url.pathname.split('/').filter(Boolean).at(0));

    // ensure settings are loaded on client side only
    onMount(() => {
        const settings = loadSettings();
        settingsStore.set(settings);

        if ($currentClientAuth) {
            onAuthStateChanged($currentClientAuth, currentClientUser.set)
        }
        
        if (settings.selectedProjectId) { 
            goto('/manage');
        } else {
            goto('/settings');
        }
    });
</script>

<svelte:head>
    <link href="https://unpkg.com/boxicons@2.0.7/css/boxicons.min.css" rel="stylesheet" />
</svelte:head>

<div class="app">
    <Header>
        <ul>
            {#if $settingsStore.selectedProjectId}
            <li class:current={$pathStartsWith === 'manage'}
                in:slide={{ duration: 400, axis: 'x' }} out:slide={{ duration: 400, axis: 'x' }}>
                <a href="/manage">
                    <span class="emphasis no-wrap">{$settingsStore.selectedProjectId}</span>
                </a>
            </li>
            {/if}
            <li class:current={$pathStartsWith === 'settings'}>
                <a href="/settings"><i class="bx bx-cog"></i></a>
            </li>
            <li class:current={$pathStartsWith === 'sverdle'}>
                <a href="/sverdle"><i class="bx bx-dice-5"></i></a>
            </li>
        </ul>
    </Header>

    <main>
        <slot />
    </main>

    <footer></footer>
    <Snackbar />
</div>

<style>
    .app {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
    }

    ul {
        padding: 0;
        margin: 0;
        height: 3em;
        display: flex;
        justify-content: center;
        align-items: center;
        list-style: none;
    }

    li {
        position: relative;
        height: 100%;
    }

    li.current::before {
        --size: 6px;
        content: '';
        width: 0;
        height: 0;
        position: absolute;
        top: 0;
        left: calc(50% - var(--size));
        border: var(--size) solid transparent;
        border-top: var(--size) solid var(--color-theme-1);
    }

    li > * {
        display: flex;
        height: 100%;
        align-items: center;
        padding: 0 0.5rem;
        color: var(--color-text);
        font-weight: 700;
        font-size: 0.8rem;
        text-decoration: none;
        transition: all .2s ease-in-out;
    }

    a:hover {
        color: var(--color-theme-1);
    }

    main {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 1rem;
        width: 100%;
        max-width: 64rem;
        margin: 0 auto;
        box-sizing: border-box;
    }

    footer {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 12px;
    }

    @media (min-width: 480px) {
        footer {
            padding: 12px 0;
        }
    }
</style>
