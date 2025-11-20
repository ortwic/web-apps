<script lang="ts">
    import json from 'json5';
    import { createEventDispatcher } from "svelte";
    import { derived } from 'svelte/store';
    import { EditorView, basicSetup } from "codemirror";
    import { jsonLanguage } from "@codemirror/lang-json";
    import { EditorState, type Extension } from "@codemirror/state";
    import { oneDark } from "@codemirror/theme-one-dark";
    import { highlightActiveLine } from '@codemirror/view';
    import { colorScheme } from '@web-apps/svelte-tabulator';

    type T = $$Generic<object>;
    export let value = {} as T;

    const dispatch = createEventDispatcher<{ changed: T }>();

    let validationMessage = '';
    
    const theme = derived(colorScheme, s => s === 'dark' ? oneDark : []);
    
    function codemirror(parent: HTMLElement, theme: Extension) {
        function createEditor(theme: Extension) {
            const state = EditorState.create({
                doc: json.stringify(value, null, 2),
                extensions: [
                    basicSetup,
                    jsonLanguage,
                    highlightActiveLine(),
                    EditorView.lineWrapping,
                    EditorView.updateListener.of(({ state, docChanged }) => {
                        if (docChanged) {
                            try {
                                value = json.parse<T>(state.doc.toString());
                                validationMessage = '';
                                dispatch('changed', value);
                            } catch (error: any) {
                                validationMessage = error.message;
                            }
                        }
                    }),
                    theme
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

<p class="w-100 center validation">
{#if validationMessage}
    Invalid JSON: {validationMessage}
{/if}
&nbsp;
</p>

<style>
    div {
        min-height: 12em;
    }

    .validation {
        font-weight: bold;
        color: var(--color-theme-1);
    }
</style>