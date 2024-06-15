<script lang="ts">
    import { currentFirebaseConfig } from '$lib/stores/appSettings.store';
    import Schema from './Schema.svelte';
</script>

<svelte:head>
    <title>Custom Firebase CMS</title>
    <meta name="description" content="Custom Firebase Content Management System" />
</svelte:head>

{#if $currentFirebaseConfig?.projectId}
    <Schema />
{/if}
