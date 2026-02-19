import json from 'json5';
import yaml from 'js-yaml';
import { EditorView, basicSetup } from 'codemirror';
import { json5, json5ParseLinter, json5Language } from 'codemirror-json5';
import { json5SchemaLinter, json5SchemaHover, json5Completion, json5Schema } from 'codemirror-json-schema/json5';
import { handleRefresh, stateExtensions } from 'codemirror-json-schema';
import { autocompletion, CompletionContext } from '@codemirror/autocomplete';
import { indentLess, indentWithTab } from '@codemirror/commands';
import { yaml as yamlLang } from '@codemirror/lang-yaml';
import { linter } from '@codemirror/lint';
import { Compartment, EditorState, type Extension } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { highlightActiveLine, hoverTooltip, keymap } from '@codemirror/view';
import type { ActionReturn } from 'svelte/action';
import { debounce } from '../utils/ui.helper';

export type SchemaType = 'json5' | 'yaml';
const extensionsMap: Record<SchemaType, Extension[]> = {
    json5: [
        json5(), 
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
        linter(json5ParseLinter(), {
            delay: 300,
            needsRefresh: handleRefresh,
        }), linter(json5SchemaLinter(), {
            delay: 300,
            needsRefresh: handleRefresh,
        }), 
        hoverTooltip(json5SchemaHover()),
        json5Schema()
    ],
    yaml: [
        yamlLang(),
    ],
};

type EditorParams<T> = {
    value: T;
    theme: 'dark' | 'light';
    type: SchemaType;
    schema: {};
    extensions: Extension[];
    debounceInMs?: number;
    onChanged(value: T): void;
    onError(error: string): void;
};

export function codemirror<T>(
    parent: HTMLElement,
    { value, theme, type, schema, extensions, debounceInMs, onChanged, onError }: EditorParams<T>,
): ActionReturn<Pick<EditorParams<T>, 'value' | 'theme'>> {
    const themeCompartment = new Compartment();
    const themeExtension = (theme: EditorParams<T>['theme']) => (theme === 'dark' ? oneDark : []);
    const serialize = (value: T) => type === 'yaml' ? yaml.dump(value) : json.stringify(value, null, 2);
    
    const handleChange = debounce((state: EditorState) => {
        try {
            value = yaml.load(state.doc.toString()) as T;
            onChanged(value);
        } catch (error: any) {
            onError(error.message);
        }
    }, debounceInMs || 500);

    const state = EditorState.create({
        doc: serialize(value),
        extensions: [
            basicSetup,
            keymap.of([indentWithTab, { key: 'Shift-Tab', preventDefault: true, run: indentLess }]),
            highlightActiveLine(),
            stateExtensions(schema as any),
            EditorView.lineWrapping,
            EditorView.updateListener.of(({ state, docChanged }) => (docChanged ? handleChange(state) : null)),
            themeCompartment.of(themeExtension(theme)),
            ...extensionsMap[type],
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
                    insert: serialize(value),
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
