<script lang="ts">
    import { currentClientApp } from '$lib/stores/clientApp.store';
    import Schema from './Schema.svelte';
</script>

<svelte:head>
    <title>Custom Firebase CMS</title>
    <meta name="description" content="Custom Firebase Content Management System" />
</svelte:head>

{#if $currentClientApp}
    <Schema />
{/if}
