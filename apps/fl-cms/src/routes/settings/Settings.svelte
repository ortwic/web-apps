<script lang="ts">
    import { derived } from 'svelte/store';
    import { push } from 'svelte-spa-router';
    import type { User } from 'firebase/auth';
    import { colorScheme } from '@web-apps/svelte-tabulator';
    import Login from '../../lib/components/Login.svelte';
    import Logout from '../../lib/components/Logout.svelte';
    import { currentClientAuth, currentClientUser } from '../../lib/stores/firebase.store';
    import SelectProject from './SelectProject.svelte';
    import FirebaseConfigEditForm from './FirebaseConfigEditForm.svelte';

    const themeIcon = derived(colorScheme, s => s === 'light' ? 'bx-moon' : 'bx-sun');

    function toggleTheme() {
        document.documentElement.classList.remove($colorScheme);
        colorScheme.set($colorScheme === 'light' ? 'dark' : 'light');
        document.documentElement.classList.add($colorScheme);
    }
    
    function login(user: User | null) {
        currentClientUser.set(user);
        push('/manage');
    }

</script>

<svelte:head>
    <title>Settings</title>
    <meta name="description" content="Settings of this app" />
</svelte:head>

<div class="text-column">
    <div>
        <p>
            <button on:click={() => toggleTheme()}>
                <i class="bx {$themeIcon}"></i> Switch Theme
            </button>
        </p>

        {#if $currentClientUser}
        <Logout auth={$currentClientAuth} user={$currentClientUser} />
        {:else}
        <Login auth={$currentClientAuth} on:login={({ detail: user }) => login(user)} />
        {/if}

        <p>
            <span>Current project</span>
            <br/>
            <SelectProject width="100%" disabled={!!$currentClientUser} />
        </p>
    </div>

    <FirebaseConfigEditForm />
</div>

<style>
    .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }
</style>
