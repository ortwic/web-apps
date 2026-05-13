<script lang="ts">
    export let isLoading = true;
    export let title: string;
</script>

{#if isLoading}
<div id="loader" class="overlay" title="Loading {title}">
    <i class="bx bx-loader bx-spin"></i>
</div>
{:else}
    <slot></slot>
{/if}

<style>
    div {
        position: absolute;
        top: 20%;
        left: 0;
        right: 0;
        text-align: center;
    }
</style>