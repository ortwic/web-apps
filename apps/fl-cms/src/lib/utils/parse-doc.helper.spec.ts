// parse-document.test.ts
import { describe, it, expect } from 'vitest';
import { parseDocument } from './parse-doc.helper';

type Entry = { id?: string; name?: string };

describe('parseDocument', () => {
    describe('valid YAML', () => {
        it('parses entries with existing ids without warnings', () => {
            const yaml = `- id: intro\n  name: Introduction\n- id: basics\n  name: Basics`;
            const { doc, warnings } = parseDocument<Entry>(yaml, 'test.yaml');

            expect(doc).toHaveLength(2);
            expect(warnings).toBeUndefined();
        });

        it('generates id from name when id is missing', () => {
            const yaml = `- name: Hello World`;
            const { doc, warnings } = parseDocument<Entry>(yaml, 'test.yaml');

            expect(doc[0].id).toBe('hello-world');
            expect(warnings).toBeUndefined();
        });

        it('transliterates German umlauts in generated id', () => {
            const yaml = `- name: "Über Uns & Co."`;
            const { doc } = parseDocument<Entry>(yaml, 'test.yaml');

            expect(doc[0].id).toBe('ueber-uns-co');
        });

        it('strips leading and trailing hyphens from generated id', () => {
            const yaml = `- name: "---Hello---"`;
            const { doc } = parseDocument<Entry>(yaml, 'test.yaml');

            expect(doc[0].id).toBe('hello');
        });
    });

    describe('warnings', () => {
        it('warns once for all entries missing id and name', () => {
            const yaml = `- title: no id\n- title: also no id`;
            const { warnings } = parseDocument<Entry>(yaml, 'test.yaml');

            expect(warnings).toHaveLength(1);
            expect(warnings![0]).toMatch(/Missing id.*0, 1/);
        });

        it('warns once for all duplicate ids', () => {
            const yaml = `- id: dup\n- id: dup\n- id: other\n- id: other`;
            const { warnings } = parseDocument<Entry>(yaml, 'test.yaml');

            expect(warnings).toHaveLength(1);
            expect(warnings![0]).toMatch(/Duplicate ids.*dup.*other/);
        });

        it('collects both warning types in one pass', () => {
            const yaml = `- title: no id\n- id: dup\n- id: dup`;
            const { warnings } = parseDocument<Entry>(yaml, 'test.yaml');

            expect(warnings).toHaveLength(2);
        });
    });

    describe('invalid YAML', () => {
        it('returns empty doc and error on malformed YAML', () => {
            const { doc, error } = parseDocument<Entry>('invalid: [yaml: content', 'test.yaml');

            expect(doc).toHaveLength(0);
            expect(error).toBeInstanceOf(Error);
        });
    });
});