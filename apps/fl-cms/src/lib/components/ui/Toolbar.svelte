<script lang="ts">
    export let width: string = 'auto';
</script>

<section class="toolbar x-flex-full" style:width>
    <span class="corner">
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
