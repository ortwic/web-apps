<script lang="ts">
    import json from 'json5';
    import Ajv from 'ajv';
    import type { JSONSchema7 } from 'json-schema';
    import { createEventDispatcher } from "svelte";
    import { derived } from 'svelte/store';
    import { EditorView, basicSetup } from "codemirror";
    import { handleRefresh, jsonCompletion, jsonSchemaHover, jsonSchemaLinter, stateExtensions } from 'codemirror-json-schema';
    import { autocompletion, CompletionContext } from "@codemirror/autocomplete";
    import { indentLess, indentWithTab } from "@codemirror/commands";
    import { jsonLanguage, jsonParseLinter } from "@codemirror/lang-json";
    import { linter } from '@codemirror/lint';
    import { EditorState, type Extension } from "@codemirror/state";
    import { oneDark } from "@codemirror/theme-one-dark";
    import { highlightActiveLine, hoverTooltip, keymap } from '@codemirror/view';
    import { colorScheme } from '@web-apps/svelte-tabulator';
    import type { JSONValidationError } from '../../models/schema.model';
    import schema from '../../schema/generated/any-property.schema.json';

    type T = $$Generic<object>;
    export let value = {} as T;
    export let debounceInMs = 500;
    
    const dispatch = createEventDispatcher<{ changed: T, validated: JSONValidationError }>();
    const theme = derived(colorScheme, s => s === 'dark' ? oneDark : []);
    const ajv = new Ajv({
        allErrors: true,
        strict: false
    });
    ajv.addFormat("regex", {
        type: "string",
        validate: (value: string) => {
            try {
                new RegExp(value);
                return true;
            } catch {
                return false;
            }
        }
    });
    
    const validate = ajv.compile(schema);
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;
    
    function onlyUnique<T>(value: T, index: number, array: T[]) {
        return array.indexOf(value) === index;
    }

    function codemirror(parent: HTMLElement, theme: Extension) {
        function createEditor(theme: Extension) {
            const state = EditorState.create({
                doc: json.stringify(value, null, 2),
                extensions: [
                    basicSetup,
                    jsonLanguage,
                    jsonLanguage.data.of({ 
                        autocomplete(context: CompletionContext) {
                            const completion = jsonCompletion();
                            return completion(context);
                        } 
                    }),
                    keymap.of([
                        indentWithTab,
                        { key: "Shift-Tab", preventDefault: true, run: indentLess }
                    ]),
                    autocompletion(),
                    linter(jsonParseLinter(), { delay: 300, needsRefresh: handleRefresh }),
                    linter(jsonSchemaLinter(), { delay: 300, needsRefresh: handleRefresh }),
                    highlightActiveLine(),
                    hoverTooltip(jsonSchemaHover()),
                    stateExtensions(schema as JSONSchema7),
                    EditorView.lineWrapping,
                    EditorView.updateListener.of(({ state, docChanged }) => {
                        if (docChanged) {
                            clearTimeout(debounceTimer);

                            debounceTimer = setTimeout(() => {
                                try {
                                    value = json.parse<T>(state.doc.toString());
                                    if (validate(value)) {                                    
                                        dispatch('changed', value);
                                    } else if (validate.errors) {
                                        const messages = validate.errors
                                            .map(e => json.stringify(e))
                                            // .map(e => json.stringify(Object.values(e).filter(Boolean)))
                                            .filter(onlyUnique);
                                        dispatch('validated', { schema: messages });
                                    }
                                } catch (error: any) {
                                    dispatch('validated', { syntax: error.message, schema: [] });
                                } 
                            }, debounceInMs);
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
