<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { showError } from '../../stores/notification.store';

    export let accept: string[] = [];

    const dispatch = createEventDispatcher<{
        drop: { data: string; file: File };
        enter: void;
    }>();

    let isOver = false;
    let dragCounter = 0;  // ← zählt verschachtelte enter/leave

    function handleDragEnter() {
        dragCounter++;
        if (dragCounter === 1) {
            isOver = true;
            dispatch('enter');
        }
    }

    function handleDragLeave() {
        dragCounter--;
        if (dragCounter === 0) {
            isOver = false;
        }
    }

    function handleDrop({ dataTransfer }: DragEvent) {
        dragCounter = 0;
        isOver = false;
        if (!dataTransfer) 
            return;

        for (const item of dataTransfer.items) {
            if (item.kind === 'file') {
                const file = item.getAsFile() ?? ({} as File);
                if (accept.includes(file.type)) {
                    readFile(file, (data) => dispatch('drop', { data, file }));
                } else {
                    showError(`Unsupported file type: ${file.type}`);
                }
            }
        }
    }

    function readFile(file: File, action: (data: string) => void) {
        const reader = new FileReader();
        reader.onload = () => action(`${reader.result}`);
        reader.readAsText(file);
    }
</script>

<div
    title="Drop file here to import data"
    class:is-over={isOver}
    on:dragover|preventDefault={() => {}}
    on:dragenter|preventDefault={handleDragEnter}
    on:dragleave|preventDefault={handleDragLeave}
    on:drop|preventDefault={handleDrop}
>
    <slot></slot>
    {#if isOver}
        <div class="drop-overlay">
            <span>Drop to import</span>
        </div>
    {/if}
</div>

<style>
    div {
        height: 100%;
        overflow: hidden;
        position: relative;
    }

    .drop-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: color-mix(in srgb, currentColor 8%, transparent);
        border: 2px dashed currentColor;
        border-radius: 4px;
        pointer-events: none;
    }

    .drop-overlay span {
        font-size: 0.9rem;
        opacity: 0.7;
    }
</style>