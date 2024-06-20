<script lang="ts">
    import { derived } from 'svelte/store';
    import Header from '$lib/components/Header.svelte';
    import Snackbar from '$lib/components/Snackbar.svelte';
    import { page } from '$app/stores';
    import SelectProject from './SelectProject.svelte';
    import '../styles/common.css';
    import '../styles/utils.css';

    const pathStartsWith = derived(page, p => p.url.pathname.split('/').filter(Boolean).at(0));
</script>

<svelte:head>
    <link href="https://unpkg.com/boxicons@2.0.7/css/boxicons.min.css" rel="stylesheet" />
</svelte:head>

<div class="app">
    <Header>
        <ul>
            <li class:current={$pathStartsWith === 'manage'}>
                <a href="/"><i class="bx bx-home-alt"></i></a>
            </li>
            <li class:current={$pathStartsWith === 'settings'}>
                <a href="/settings"><i class="bx bx-cog"></i></a>
            </li>
            <li>
                <span>
                    <SelectProject />
                </span>
            </li>
            <li class:current={$pathStartsWith === 'sverdle'}>
                <a href="/sverdle"><i class="bx bx-dice-5"></i></a>
            </li>
            <li class:current={$pathStartsWith === 'profile'}>
                <a href="/profile"><i class="bx bx-user"></i></a>
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
        text-transform: uppercase;
        letter-spacing: 0.1em;
        text-decoration: none;
        transition: color 0.2s linear;
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
