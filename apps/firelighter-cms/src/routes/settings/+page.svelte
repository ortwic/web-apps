<script lang="ts">
    import { goto } from '$app/navigation';
    import Login from '$lib/components/Login.svelte';
    import Logout from '$lib/components/Logout.svelte';
    import { currentClientAuth, currentClientUser } from '$lib/stores/firebase.store';
    import SelectProject from './SelectProject.svelte';
    import FirebaseConfigEditForm from './FirebaseConfigEditForm.svelte';
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
        <Login auth={$currentClientAuth} on:login={() => goto('/manage')} />
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
