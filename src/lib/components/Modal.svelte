<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    export let open = false;
    export let title = '';

    const dispatcher = createEventDispatcher();

    let modal: HTMLDialogElement;

    $: if (open) {
        modal?.showModal();
    } else {
        modal?.close();
    }
</script>

<dialog bind:this={modal}>
    {#if open}
        <div class="header">
            <h2>{title}</h2>
            <button class="clear" on:click={() => dispatcher('close')}>
                <i class="bx bx-x"></i>
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
        max-height: 100%;
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
        display: flex;
        justify-content: space-between;
        border-bottom: 1px solid var(--color-theme-2);
    }

    .content {
        display: flex;
        flex-direction: column;
        padding: 1rem;
        overflow: auto;
    }
</style>
