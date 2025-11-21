<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    export let open = false;
    export let width = "auto";
    export let height = "";
    export let closable = true;

    const dispatcher = createEventDispatcher();

    let modal: HTMLDialogElement;

    function closeModal() {
        if (closable) {
            dispatcher('close');
        }
    }

    function handleEscapeKey(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            closeModal();
        }
    }

    $: if (open) {
        modal?.showModal();
    } else {
        modal?.close();
    }
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<dialog bind:this={modal} style:width={width} style:height={height} on:click={closeModal} on:keydown={handleEscapeKey}>
    {#if open}
    {#if closable}
    <div class="header x-flex-full">
        <button class="clear" on:click={closeModal}>
            <i class="bx bx-x clear"></i>
        </button>
    </div>
    {/if}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="content" on:click={(ev) => ev.stopImmediatePropagation()}>
        <slot />
    </div>
    {/if}
</dialog>

<style>
    dialog {
        opacity: 0;
        transform: scale(0);

        position: fixed;
        display: flex;
        flex-direction: column;
        padding: 0;
        min-width: 18rem;
        max-height: calc(100% - 2rem);
        border-radius: 0.5rem;
        background-color: var(--color-bg-2);
        border: 1px solid var(--color-theme-2);
        box-shadow: 2px 2px 8px #00000080;
        transition: all 0.3s allow-discrete;
    }

    dialog[open] {
        opacity: 1;
        transform: scale(1);
    }

    dialog::backdrop {
        background-color: #00000000;
        transition: all 0.3s allow-discrete;
    }

    dialog[open]::backdrop {
        background-color: #00000080;
    }

    .header {
        position: absolute;
        top: 0;
        right: 0;
    }

    .header > button {
        padding: 0;
        font-size: x-large;
    }

    .content {
        display: flex;
        flex-direction: column;
        padding: 1rem;
        height: 100%;
        overflow: auto;
        transition: all 0.3s allow-discrete;
    }
</style>
