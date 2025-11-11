<script lang="ts">
    import 'bytemd/dist/index.css';
    import { Editor } from 'bytemd';
    import { createEventDispatcher } from 'svelte';

    export let value: string;
    export let placeholder = '';

    const dispatch = createEventDispatcher();
</script>

<Editor {value} {placeholder} on:change={({ detail }) => dispatch('change', detail['value'])} />

<style>
</style>
