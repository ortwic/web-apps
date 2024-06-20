<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";

    onMount(() => {
        goto('/manage');
    });
</script>

<svelte:head>
    <title>Custom Firebase CMS</title>
    <meta name="description" content="Custom Firebase Content Management System" />
</svelte:head>
