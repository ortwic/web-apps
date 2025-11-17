<script lang="ts">
    import Modal from "../ui/Modal.svelte";

    export let src: string | undefined;
    export let name = '';
</script>

<Modal open={!!src} on:close={() => (src = undefined)}>
    {#if src}
        <img {src} alt={name} />
    {/if}
</Modal>