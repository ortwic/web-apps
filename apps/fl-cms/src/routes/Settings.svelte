<script lang="ts">
    import { derived } from 'svelte/store';
    import { push, querystring } from 'svelte-spa-router';
    import { colorScheme } from '@web-apps/svelte-tabulator';
    import Login from '../lib/components/common/Login.svelte';
    import Logout from '../lib/components/common/Logout.svelte';
    import Expand from '../lib/components/ui/Expand.svelte';
    import { currentClientUser } from '../lib/stores/app.store';
    import SelectProject from '../lib/components/settings/SelectProject.svelte';
    import FirebaseConfigEditForm from '../lib/components/settings/FirebaseConfigEditForm.svelte';

    const themeIcon = derived(colorScheme, s => s === 'light' ? 'bx-moon' : 'bx-sun');
    const targetUrl = derived(querystring, q => q?.split('=')[1] ?? '/');

    function toggleTheme() {
        document.documentElement.classList.remove($colorScheme);
        colorScheme.set($colorScheme === 'light' ? 'dark' : 'light');
        document.documentElement.classList.add($colorScheme);
    }
</script>

<svelte:head>
    <title>Settings</title>
    <meta name="description" content="Settings of this app" />
</svelte:head>


<section class="text-column">
    <p class="x-flex-full">
        {#if $currentClientUser}
        <Logout user={$currentClientUser} />
        {:else}
        <Login on:login={() => push($targetUrl)} />
        {/if}
        <button on:click={() => push('/doc')}>
            <i class="bx bxs-grid"></i> Index
        </button>
        <button on:click={() => push('/media')}>
            <i class="bx bx-folder-open"></i> Media
        </button>
        <button class="" title="Switch Theme" on:click={() => toggleTheme()}>
            <i class="bx {$themeIcon}"></i> {$colorScheme === 'light' ? 'Dark' : 'Light'}
        </button>
    </p>
        
    <Expand>
        <span slot="header" class="x-flex-full">
            <h3>Project settings</h3>
        </span>
        <div class="content">
            <div class="grid">
                <span>Current project</span>
                <SelectProject width="100%" disabled={!!$currentClientUser} />
            </div>

            <FirebaseConfigEditForm />
        </div>
    </Expand>
</section>

<style lang="scss">
    h3 {
        margin: .2em 0;
    }

    section {
        padding: 1em;
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
