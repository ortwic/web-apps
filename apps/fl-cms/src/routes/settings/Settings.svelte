<script lang="ts">
    import { push } from 'svelte-spa-router';
    import type { User } from 'firebase/auth';
    import Login from '../../lib/components/Login.svelte';
    import Logout from '../../lib/components/Logout.svelte';
    import { currentClientAuth, currentClientUser } from '../../lib/stores/firebase.store';
    import SelectProject from './SelectProject.svelte';
    import FirebaseConfigEditForm from './FirebaseConfigEditForm.svelte';

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
    <div class="grid">
        <div>
            <span>Current project</span>
            <br/>
            <SelectProject width="100%" disabled={!!$currentClientUser} />
        </div>

        {#if $currentClientUser}
        <Logout auth={$currentClientAuth} user={$currentClientUser} />
        {:else}
        <Login auth={$currentClientAuth} on:login={({ detail: user }) => login(user)} />
        {/if}
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
