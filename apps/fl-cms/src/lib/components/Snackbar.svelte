<script lang="ts">
    import { fade } from 'svelte/transition';
    import { messageStack } from '../../lib/stores/notification.store';
</script>

<section>
    {#each $messageStack as item}
        <div class="message {item.type}" in:fade={{ duration: 200 }} out:fade={{ duration: 200 }}>
            {item.message}
            <slot name="message"></slot>
        </div>
    {/each}
</section>

<style>
    section {
        position: fixed;
        z-index: 2e3;
        left: 0;
        bottom: 0;
        width: 100%;
    }

    .message {
        padding: 16px;
        text-align: center;
        opacity: 0.8;
        border-top: 1px solid gray;
        transition: all .25s ease-in-out;
    }

    .message:hover {
        opacity: 1;
    }

    .message.info {
        background-color: var(--color-bg-1);
    }

    .message.warn {
        color: white;
        background-color: var(--color-theme-2);
    }

    .message.error {
        color: white;
        background-color: firebrick;
    }
</style>
