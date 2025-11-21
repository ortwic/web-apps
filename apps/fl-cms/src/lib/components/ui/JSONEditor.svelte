<script lang="ts">
    import json from 'json5';
    import { createEventDispatcher } from "svelte";
    import { derived } from 'svelte/store';
    import { EditorView, basicSetup } from "codemirror";
    import { indentLess, indentWithTab } from "@codemirror/commands";
    import { jsonLanguage } from "@codemirror/lang-json";
    import { EditorState, type Extension } from "@codemirror/state";
    import { oneDark } from "@codemirror/theme-one-dark";
    import { highlightActiveLine, keymap } from '@codemirror/view';
    import { colorScheme } from '@web-apps/svelte-tabulator';

    type T = $$Generic<object>;
    export let value = {} as T;
    export let debounceInMs = 500;
    export let extensions: Extension[] = [];
    
    const dispatch = createEventDispatcher<{ changed: T, error: string }>();
    const theme = derived(colorScheme, s => s === 'dark' ? oneDark : []);

    let debounceTimer: ReturnType<typeof setTimeout> | undefined;

    function codemirror(parent: HTMLElement, theme: Extension) {
        function createEditor(theme: Extension) {
            const state = EditorState.create({
                doc: json.stringify(value, null, 2),
                extensions: [
                    basicSetup,
                    jsonLanguage,
                    keymap.of([
                        indentWithTab,
                        { key: "Shift-Tab", preventDefault: true, run: indentLess }
                    ]),
                    highlightActiveLine(),
                    EditorView.lineWrapping,
                    EditorView.updateListener.of(({ state, docChanged }) => {
                        if (docChanged) {
                            clearTimeout(debounceTimer);

                            debounceTimer = setTimeout(() => {
                                try {
                                    value = json.parse<T>(state.doc.toString());
                                    dispatch('changed', value);
                                } catch (error: any) {
                                    dispatch('error', error.message);
                                } 
                            }, debounceInMs);
                        }
                    }),
                    theme,
                    ...extensions
                ]
            });        
            return new EditorView({ state, parent });
        }

        let editor = createEditor(theme);

        return {
            update(newTheme: Extension) {
                editor.destroy();
                editor = createEditor(newTheme);
            },
            destroy() {
                editor.destroy();
            },
        };
    }
</script>

<div use:codemirror={$theme}></div>
