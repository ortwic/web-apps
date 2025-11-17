<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { HTMLInputTypeAttribute } from "svelte/elements";
    import { confirmed } from "../../utils/ui.helper";

    export let id = '';
    export let type: HTMLInputTypeAttribute = 'text';
    export let value: string;
    export let placeholder = '';
    export let disabled = false;

    const dispatch = createEventDispatcher<{ changed: string }>();
    let original = value;

    $: dirty = value !== original;
    $: title = dirty ? 'Press enter to save' : '';

    function input(e: Event & { currentTarget: HTMLInputElement }) {
        value = e.currentTarget.value;
    }

    function changed(event: Event & { currentTarget: EventTarget & HTMLInputElement; }) {
        original = event.currentTarget.value;
        dispatch('changed', event.currentTarget.value);
    }
</script>

<input {type} {id} {disabled} {value} {placeholder} class:dirty {title}
    on:input={(ev) => input(ev)}
    on:keydown={(ev) => confirmed(ev) && changed(ev)}
    on:blur={(ev) => changed(ev)} />

<style>
    input, input:focus-visible {
        transition: all .25s ease-in-out;
        outline-color: transparent;
    }

    input.dirty, input.dirty:focus-visible {
        background-color: var(--color-bg-0);
        border-color: var(--color-theme-1);
        outline-color: var(--color-theme-1);
        box-shadow: 0 0 4px var(--color-theme-2);
    }
</style>