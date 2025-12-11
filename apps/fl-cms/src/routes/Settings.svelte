<script lang="ts">
    import { derived } from 'svelte/store';
    import { push, querystring } from 'svelte-spa-router';
    import { colorScheme } from '@web-apps/svelte-tabulator';
    import { APP_FUNDING, APP_TITLE } from '../app.info';
    import Login from '../lib/components/common/Login.svelte';
    import Logout from '../lib/components/common/Logout.svelte';
    import Expand from '../lib/components/ui/Expand.svelte';
    import { appStore, currentClientUser } from '../lib/stores/app.store';
    import { anySettings } from '../lib/stores/settings.store';
    import SelectProject from '../lib/components/settings/SelectProject.svelte';
    import FirebaseConfigEditForm from '../lib/components/settings/FirebaseConfigEditForm.svelte';
    import TermsOfUseDialog from '../lib/components/common/TermsOfUseDialog.svelte'; 
    
    const themeIcon = derived(colorScheme, s => s === 'light' ? 'bx-moon' : 'bx-sun');
    const targetUrl = derived(querystring, q => q?.split('=')[1] ?? '/');
    let disabled = !anySettings();

    function toggleTheme() {
        document.documentElement.classList.remove($colorScheme);
        colorScheme.set($colorScheme === 'light' ? 'dark' : 'light');
        document.documentElement.classList.add($colorScheme);
    }
</script>

<svelte:head>
    <title>{APP_TITLE} | Settings</title>
</svelte:head>

<section class="text-column">
    <p class="x-flex-full">
        {#if $currentClientUser}
        <Logout user={$currentClientUser} />
        {:else}
        <Login on:login={() => push($targetUrl)} />
        {/if}
        <button on:click={() => push('/')} disabled={!$appStore.validConfig}>
            <i class="bx bxs-grid"></i> Index
        </button>
        <button on:click={() => push('/media')} disabled={!$appStore.validConfig}>
            <i class="bx bx-folder-open"></i> Media
        </button>
        <button class="" title="Switch Theme" on:click={() => toggleTheme()}>
            <i class="bx {$themeIcon}"></i> {$colorScheme === 'light' ? 'Dark' : 'Light'}
        </button>
    </p>
    <p>
        <Expand>
            <span slot="header" class="x-flex-full emphasis">
                <h3>Project settings</h3>
            </span>
            <div class="content">
                <div class="grid">
                    <span>Current project</span>
                    <SelectProject width="100%" disabled={!!$currentClientUser} />
                </div>

                <FirebaseConfigEditForm {disabled} />
            </div>
        </Expand>
    </p>
    <p>
        <Expand open={false}>
            <span slot="header" class="x-flex-full emphasis">
                <h3>About</h3>
            </span>
            <div class="content">
                <p>
                    <img src="icon.svg" alt="logo" style:width="16px"> {APP_TITLE} is designed as a lightweight and simplified alternative inspired by 
                    <a href="https://app.firecms.co" target="_blank" rel="noopener noreferrer">FireCMS</a>, 
                    while still relying on its familiar data models. The focus lies on offering a 
                    streamlined experience with an interface that stays out of the user’s way and keeps 
                    everyday tasks quick and approachable.
                </p>
                <h3>Key Features</h3>
                <ul>
                    <li>
                        <p>A clean and simplified UI</p>
                    </li>
                    <li>
                        <p>Firebase settings stored <strong>locally in the user’s browser</strong></p>
                        <ul>
                            <li>No external connection required</li>
                            <li>No user limits</li>
                        </ul>
                    </li>
                    <li>
                        <p>Easy handling of subcollections</p>
                        <ul>
                            <li>Writing a path like <code>foo/bar/baz</code> automatically generates the entire nested structure</li>
                        </ul>
                    </li>
                    <li>
                        <p>A straightforward editing experience</p>
                        <ul>
                            <li>Full-width content editing</li>
                            <li>Easy section reordering</li>
                            <li>Markdown powered by <a href="https://bytemd.js.org/" target="_blank" rel="noopener noreferrer">ByteMD</a></li>
                        </ul>
                    </li>
                    <li>
                        <p>Storage management for images included</p>
                    </li>
                </ul>
                <p>
                    <img src="icon.svg" alt="logo" style:width="16px"> {APP_TITLE} aims to provide a smooth workflow for anyone who prefers clarity over 
                    complexity while still enjoying the flexibility of a Firebase-based setup.
                </p>
            </div>
        </Expand>
    </p>
    <p>
        <Expand>
            <span slot="header" class="x-flex-full emphasis">
                <h3>Your Support</h3>
            </span>
            <div class="content" style="display: grid; grid-template-columns: 1fr auto; gap: 1em">
                <span>
                    <p>
                        <img src="icon.svg" alt="logo" style:width="16px"> {APP_TITLE} is offered for free, with no subscriptions or premium tiers. Development 
                        and maintenance are carried out independently, and contributions are welcomed 
                        to support ongoing improvements.
                    </p>
                    <p>
                        Donations can be made through <strong>Liberapay</strong>, a platform chosen 
                        for its fair conditions and community-friendly approach.
                    </p>
                    <p class="center">
                        <a class="emphasis highlight" role="button" target="_blank" href={APP_FUNDING}>
                            <span>
                                <img class="logo" src="/images/liberapay.svg" alt="Donate with Liberapay" width="16" /> Donate
                            </span>
                        </a>
                    </p>
                    <p>
                        Any contribution helps — whether it goes toward something to eat 
                        (developers are known to survive on remarkably questionable snack choices) 
                        or toward a hot beverage ☕ and 🍪🍪🍪.</p>
                    <p>
                        Thank you for supporting the project and helping it grow.
                    </p>
                </span>
                <span>
                    <img src="/images/support-this-project.png" alt="Support this project" />
                    <br/>
                    <div class="image-caption center w-100">Source: AI Slop</div>
                </span>
            </div>
        </Expand>
    </p>
</section>

<TermsOfUseDialog open={disabled} on:accept={() => disabled = false} />

<style lang="scss">
    h3 {
        margin: .2em 0;
    }

    section {
        padding: 1em;
    }

    p {
        hyphens: auto;
    }

    .content{
        padding: 1em;
        border: 1px solid var(--color-bg-0);

        .grid {
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 1rem;
        }
    }
</style>
