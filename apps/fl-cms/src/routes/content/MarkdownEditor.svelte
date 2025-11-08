<script lang="ts">
    import { createEventDispatcher, onDestroy } from 'svelte';
    import { Editor, rootCtx, defaultValueCtx, editorViewCtx, serializerCtx } from '@milkdown/core';
    import { nord } from '@milkdown/theme-nord';
    import { commonmark } from '@milkdown/preset-commonmark';
    import { block } from '@milkdown/plugin-block';
    import { cursor } from '@milkdown/plugin-cursor';
    import { history } from '@milkdown/plugin-history';

    export let value: string = '';
    export let intervalInSecs = 0;
    let intervalId: ReturnType<typeof setInterval>;

    onDestroy(() => clearInterval(intervalId));

    const dispatch = createEventDispatcher();

    function editor(div: HTMLElement) {
        Editor.make()
            .config((ctx) => {
                ctx.set(rootCtx, div);
                ctx.set(defaultValueCtx, value);
            })
            .config(nord)
            .use(commonmark)
            .use(block)
            .use(cursor)
            .use(history)
            .create()
            .then(editor => {
                editor.action((ctx) => {
                    const editorView = ctx.get(editorViewCtx);
                    const serializer = ctx.get(serializerCtx);
                    const update = (type: string) => {
                        const md = serializer(editorView.state.doc);
                        dispatch(type, md);
                    };
                    editorView.setProps({
                        handleDOMEvents: {
                            focus() {
                                dispatch('focus');
                                if (intervalInSecs > 0) {
                                    intervalId = setInterval(() => update('autosave'), intervalInSecs * 1000);
                                }
                            },
                            input: () => update('input'),
                            blur() {
                                update('blur');
                                clearInterval(intervalId);
                            },
                        }
                    });
                });
            });
    }
</script>

<div use:editor class="input"></div>

<style>
</style>
