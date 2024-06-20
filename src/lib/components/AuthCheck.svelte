<script lang="ts">
    import { user } from '../stores/auth.store';
</script>

<!-- https://medium.com/@flavio.pinnelli/unlock-the-sveltekit-stores-potential-with-firebase-d120de3f07e4 -->
{#if $user}
    <slot user={$user} />
{:else}
    <slot name="login" />
{/if}
