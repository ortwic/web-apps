<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { appStore } from '../../stores/app.store';
    import { EMULATOR_HOSTNAME } from '../../utils/app.helper';

    const dispatch = createEventDispatcher<{ login: void }>();

    async function login() {
        await $appStore.signIn();
        dispatch('login');
    }
</script>

<button disabled={!$appStore.validConfig} on:click={() => login()}>
    <i class="bx bx-log-in"></i> 
    <span> 
        {#if $appStore.authEmulated}
        Login {EMULATOR_HOSTNAME}
        {:else}
        Login with Google
        {/if}
    </span>
</button>
