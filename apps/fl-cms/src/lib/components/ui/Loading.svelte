<script lang="ts">
    export let isLoading = true;
</script>

{#if isLoading}
<div id="loader">
    <i class="bx bx-loader bx-spin"></i>
</div>
{:else}
    <slot></slot>
{/if}