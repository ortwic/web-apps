<script lang="ts">
    import { onMount, createEventDispatcher } from 'svelte';
    import { Editor, rootCtx, defaultValueCtx } from '@milkdown/core';
    import { nord } from '@milkdown/theme-nord';
    import { commonmark } from '@milkdown/preset-commonmark';
    import { block } from '@milkdown/plugin-block';
    import { cursor } from '@milkdown/plugin-cursor';
    import { history } from '@milkdown/plugin-history';

    export let value: string = '';

    const dispatch = createEventDispatcher();
    let editorContainer: HTMLDivElement;

    onMount(async () => {
        const editor = await Editor.make()
            .config((ctx) => {
                ctx.set(rootCtx, editorContainer);
                ctx.set(defaultValueCtx, value);
            })
            .config(nord)
            .use(commonmark)
            .use(block)
            .use(cursor)
            .use(history)
            .create();

        editor.action((ctx) => {
            // const view = ctx.get(rootCtx).firstChild?.['editorView'];
            // if (view) {
            //     view.setProps({
            //         handleDOMEvents: {
            //             input: () => {
            //                 const text = view.state.doc.textContent;
            //                 dispatch('change', text);
            //                 return false;
            //             }
            //         }
            //     });
            // }
        });
    });
</script>

<div bind:this={editorContainer} class="milkdown"></div>

<style>
</style>
