<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    export let open = false;

    const dispatcher = createEventDispatcher();

    let modal: HTMLDialogElement;

    function closeModal() {
        dispatcher('close');
    }

    function handleOutsideClick(event: MouseEvent) {
        const rect = modal.getBoundingClientRect();
        const isInDialog = (rect.top <= event.clientY && event.clientY <= rect.top + rect.height &&
            rect.left <= event.clientX && event.clientX <= rect.left + rect.width);
        if (!isInDialog) {
            closeModal();
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
<dialog bind:this={modal} on:click={handleOutsideClick} on:keydown={handleEscapeKey}>
    {#if open}
        <div class="header x-flex-full">
            <button class="clear" on:click={closeModal}>
                <i class="bx bx-x clear"></i>
            </button>
        </div>
        <div class="content">
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
        min-width: 50%;
        max-width: 100%;
        min-height: 40%;
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
        overflow: auto;
    }
</style>
