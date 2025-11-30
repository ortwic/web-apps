import json from 'json5';
import { EditorView, basicSetup } from 'codemirror';
import { json5, json5ParseLinter, json5Language } from 'codemirror-json5';
import { json5SchemaLinter, json5SchemaHover, json5Completion, json5Schema } from 'codemirror-json-schema/json5';
import { handleRefresh, stateExtensions } from 'codemirror-json-schema';
import { autocompletion, CompletionContext } from '@codemirror/autocomplete';
import { indentLess, indentWithTab } from '@codemirror/commands';
import { linter } from '@codemirror/lint';
import { Compartment, EditorState, type Extension } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { highlightActiveLine, hoverTooltip, keymap } from '@codemirror/view';
import type { ActionReturn } from 'svelte/action';
import { debounce } from '../utils/ui.helper';

type EditorParams<T> = {
    value: T;
    theme: 'dark' | 'light';
    schema: {};
    extensions: Extension[];
    debounceInMs?: number;
    onChanged(value: T): void;
    onError(error: string): void;
};

export function codemirror<T>(
    parent: HTMLElement,
    { value, theme, schema, extensions, debounceInMs, onChanged, onError }: EditorParams<T>,
): ActionReturn<Pick<EditorParams<T>, 'value' | 'theme'>> {
    const themeCompartment = new Compartment();
    const themeExtension = (theme: EditorParams<T>['theme']) => (theme === 'dark' ? oneDark : []);
    
    const handleChange = debounce((state: EditorState) => {
        try {
            value = json.parse<T>(state.doc.toString());
            onChanged(value);
        } catch (error: any) {
            onError(error.message);
        }
    }, debounceInMs || 500);

    const state = EditorState.create({
        doc: json.stringify(value, null, 2),
        extensions: [
            basicSetup,
            keymap.of([indentWithTab, { key: 'Shift-Tab', preventDefault: true, run: indentLess }]),
            json5Language.data.of({
                autocomplete: json5Completion(),
            }),
            autocompletion({
                override: [
                    // TODO override prevents TypeError: a.result.options is not iterable 
                    // https://github.com/jsonnext/codemirror-json-schema/issues/159
                    (ctx: CompletionContext) => {
                        const completion = json5Completion();
                        const result = completion(ctx);
                        return result && !Array.isArray(result) ? result : null;
                    },
                ],
            }),
            json5(),
            json5Schema(),
            linter(json5ParseLinter(), {
                delay: 300,
                needsRefresh: handleRefresh,
            }),
            linter(json5SchemaLinter(), {
                delay: 300,
                needsRefresh: handleRefresh,
            }),
            highlightActiveLine(),
            hoverTooltip(json5SchemaHover()),
            stateExtensions(schema as any),
            EditorView.lineWrapping,
            EditorView.updateListener.of(({ state, docChanged }) => (docChanged ? handleChange(state) : null)),
            themeCompartment.of(themeExtension(theme)),
            ...extensions,
        ],
    });
    const editor = new EditorView({ state, parent });

    function updateTheme(newTheme: EditorParams<T>['theme']) {
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
                    insert: json.stringify(value, null, 2),
                },
            });
        }
    }

    return {
        update({ value, theme }: Pick<EditorParams<T>, 'value' | 'theme'>) {
            updateValue(value);
            updateTheme(theme);
        },
        destroy() {
            editor.destroy();
        },
    };
}
