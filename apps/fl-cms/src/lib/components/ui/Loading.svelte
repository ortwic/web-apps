<script lang="ts">
    export let isLoading = true;
    export let title: string;
</script>

{#if isLoading}
<div id="loader" title="Loading {title}">
    <i class="bx bx-loader bx-spin"></i>
</div>
{:else}
    <slot></slot>
{/if}