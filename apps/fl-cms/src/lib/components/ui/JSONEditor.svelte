<script lang="ts">
    import json from 'json5';
    import { createEventDispatcher } from "svelte";
    import { EditorView, basicSetup } from "codemirror";
    import { indentLess, indentWithTab } from "@codemirror/commands";
    import { jsonLanguage } from "@codemirror/lang-json";
    import { Compartment, EditorState, type Extension } from "@codemirror/state";
    import { oneDark } from "@codemirror/theme-one-dark";
    import { highlightActiveLine, keymap } from '@codemirror/view';
    import { colorScheme, type ColorScheme } from '@web-apps/svelte-tabulator';

    type T = $$Generic<object>;
    type EditorParams = { value: T, theme: ColorScheme, extensions: Extension[], debounceInMs?: number };
    export let value = {} as T;
    export let debounceInMs = 500;
    export let extensions: Extension[] = [];
    
    const dispatch = createEventDispatcher<{ changed: T, error: string }>();

    function codemirror(
        parent: HTMLElement, 
        { value, theme, extensions, debounceInMs }: EditorParams
    ) {
        let debounceTimer: ReturnType<typeof setTimeout> | undefined;
        const themeCompartment = new Compartment();
        const themeExtension = (theme: ColorScheme) => theme === 'dark' ? oneDark : [];
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
                        }, debounceInMs ?? 500);
                    }
                }),
                themeCompartment.of(themeExtension(theme)),
                ...extensions
            ]
        });        
        const editor = new EditorView({ state, parent });

        function updateTheme(newTheme: ColorScheme) {
            if (theme !== newTheme) {
                theme = newTheme;
                editor.dispatch({
                    effects: themeCompartment.reconfigure(themeExtension(theme)),
                });  
            }
        }

        function updateValue(newValue: T) {
            if (value !== newValue) {
                value = newValue;
                editor.dispatch({
                    changes: {
                        from: 0,
                        to: editor.state.doc.length,
                        insert: json.stringify(value, null, 2)
                    }
                });
            }
        }

        return {
            update({ value, theme }: EditorParams) {
                updateValue(value);
                updateTheme(theme);
            },
            destroy() {
                editor.destroy();
            },
        };
    }
</script>

<div use:codemirror={{ value, theme: $colorScheme, extensions, debounceInMs }}></div>
