<section class="toolbar x-flex-full">
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
        min-width: 10%;
    }
</style>
