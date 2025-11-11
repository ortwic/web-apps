import { Editor, rootCtx, defaultValueCtx, editorViewCtx, serializerCtx, parserCtx } from '@milkdown/core';
import { nord } from '@milkdown/theme-nord';
import { commonmark } from '@milkdown/preset-commonmark';
import { block } from '@milkdown/plugin-block';
import { cursor } from '@milkdown/plugin-cursor';
import { history } from '@milkdown/plugin-history';

class MarkdownEditor extends HTMLElement {
    readonly container: Node = this.attachShadow({ mode: 'open' });
    intervalInSecs = 0;
    editor?: Editor;

    constructor() {
        super();
    }

    static get observedAttributes() {
        return ['interval'];
    }

    connectedCallback() {
        setTimeout(() => this.initEditor(this.textContent), 0);
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        switch (name) {
            case 'interval':
                this.intervalInSecs = +newValue;
                break;
        }
    }

    private async initEditor(value: string) {
        this.editor = await Editor.make()
            .config((ctx) => {
                ctx.set(rootCtx, this.container);
                ctx.set(defaultValueCtx, value);
            })
            .config(nord)
            .use(commonmark)
            .use(block)
            .use(cursor)
            .use(history)
            .create()
            .then(e => this.initHandler(e));
    }

    private initHandler(editor: Editor): Editor {
        let intervalId: ReturnType<typeof setInterval>;

        editor.action((ctx) => {
            const editorView = ctx.get(editorViewCtx);
            const serializer = ctx.get(serializerCtx);
            const update = (type: string) => {
                const detail = serializer(editorView.state.doc);
                this.dispatchEvent(new CustomEvent(type, { detail }));
            };
            editorView.setProps({
                handleDOMEvents: {
                    focus: () => this.dispatchEvent(new CustomEvent('focus')),
                    input: () => update('input'),
                    blur: () => update('done'),
                }
            });
        });
        return editor;
    }
}

if(!window.customElements.get('markdown-editor')) {
    window.customElements.define('markdown-editor', MarkdownEditor);
}