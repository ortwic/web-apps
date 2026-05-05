import yaml from 'js-yaml';
import { EditorView, basicSetup } from 'codemirror';
import { handleRefresh, stateExtensions } from 'codemirror-json-schema';
import { yamlSchemaLinter, yamlSchemaHover, yamlCompletion } from 'codemirror-json-schema/yaml';
import { autocompletion, CompletionContext } from '@codemirror/autocomplete';
import { indentLess, indentWithTab } from '@codemirror/commands';
import { yaml as yamlSupport } from '@codemirror/lang-yaml';
import { linter } from '@codemirror/lint';
import { Compartment, EditorState, type Extension } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { highlightActiveLine, hoverTooltip, keymap } from '@codemirror/view';
import type { ActionReturn } from 'svelte/action';
import { debounce } from '../utils/input.helper';

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
            value = yaml.load(state.doc.toString()) as T;
            onChanged(value);
        } catch (error: any) {
            onError(error.message);
        }
    }, debounceInMs || 500);

    const state = EditorState.create({
        doc: yaml.dump(value),
        extensions: [
            basicSetup,
            keymap.of([indentWithTab, { key: 'Shift-Tab', preventDefault: true, run: indentLess }]),
            autocompletion({
                activateOnTyping: true,
                override: [
                    // TODO override prevents TypeError: a.result.options is not iterable 
                    // https://github.com/jsonnext/codemirror-json-schema/issues/159
                    (ctx: CompletionContext) => {
                        const completion = yamlCompletion();
                        const result = completion(ctx);
                        return result && !Array.isArray(result) ? result : null;
                    },
                ],
            }),
            yamlSupport(),
            linter(yamlSchemaLinter(), {
                delay: 300,
                needsRefresh: handleRefresh,
            }),
            highlightActiveLine(),
            hoverTooltip(yamlSchemaHover()),
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
                    insert: yaml.dump(value),
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
