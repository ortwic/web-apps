<script lang="ts">
    import './web-components/MarkdownEditor';
    import { createEventDispatcher, onDestroy, onMount } from 'svelte';

    export let value: string;
    export let intervalInSecs = 0;
    let intervalId: ReturnType<typeof setInterval>;

    onMount(() => intervalId = setInterval(() => dispatch('autosave', value), intervalInSecs * 1000));
    onDestroy(() => clearInterval(intervalId));

    const dispatch = createEventDispatcher();
    const update = ({ detail }: CustomEvent) => dispatch('update', detail);
    const blur = ({ detail }: CustomEvent) => dispatch('blur', detail);

</script>

<div class="input">
    <small>{value}</small>
    <markdown-editor {value} intervalInSecs={10}
        on:focus={() => dispatch('focus')}
        on:update={update}
        on:done={blur}>
        {value}
    </markdown-editor>
</div>

<style>
</style>
