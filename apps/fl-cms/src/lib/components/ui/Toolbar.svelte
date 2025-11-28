<script lang="ts">
    export let width: string = 'auto';
    export let showNav = false;
</script>

<section class="toolbar x-flex-full" style:width>
    <span class="corner">
        {#if showNav}
        <button title="Back" disabled={!history.length} class="icon clear" on:click={() => history.back()}>
            <i class="bx bx-arrow-back"></i>
        </button>
        {/if}
        <slot />
    </span>
    <h2 class="emphasis">
        <slot name="title" />
    </h2>
    <span class="corner"></span>
</section>

<style>
    .toolbar > .corner {
        padding: 0 .8rem;
        min-width: 10%;
    }
</style>
