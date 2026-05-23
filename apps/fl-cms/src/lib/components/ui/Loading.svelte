<script lang="ts">
    export let isLoading = true;
    export let title: string;
    export let overlay = false;
</script>

{#if !isLoading || overlay}
<slot></slot>
{/if}

{#if isLoading}
<div id="loader" class="overlay" title="Loading {title}">
    <i class="bx bx-loader bx-spin"></i>
</div>
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