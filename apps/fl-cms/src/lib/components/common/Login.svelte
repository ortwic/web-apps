<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { appStore } from '../../stores/app.store';

    const dispatcher = createEventDispatcher();

    async function login() {
        await $appStore.signIn()
        dispatcher('login');
    }
</script>

<button disabled={!$appStore.validConfig} on:click={() => login()}>
    <i class="bx bx-lg bx-log-in"></i> 
    <span> 
        {#if $appStore.useEmulator}
        Login to emulator
        {:else}
        Login with Google
        {/if}
    </span>
</button>
