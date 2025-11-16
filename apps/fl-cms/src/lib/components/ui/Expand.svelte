<script lang="ts">

    import { createEventDispatcher } from 'svelte'
    import collapse from 'svelte-collapse'

    export let open = true
    export let duration = 0.2
    export let easing = 'ease'

    const dispatch = createEventDispatcher()

    function handleToggle () {
        open = !open
        dispatch(open ? 'open' : 'close')
    }

</script> 

<div class='card' class:open aria-expanded={open}>

    <span class="small card-header grid">
        <button type="button" class="clear" on:click={handleToggle}>
            <i class="bx bx-{open ? 'down' : 'right'}-arrow"></i>
        </button>
        <slot name='header'/>
    </span>

    <div class='card-body' use:collapse={{open, duration, easing}}>
        <slot />
    </div>

</div>

<style lang="scss">
    .card-header {
        cursor: pointer;
        user-select: none;
        background-color: var(--color-bg-1);
        border-bottom: 1px solid var(--color-bg-3);
    
        button {
            padding: 0 .5em;
        }
    }

    .grid {
        display: grid;
        grid-template-columns: auto 1fr;

    }
</style>