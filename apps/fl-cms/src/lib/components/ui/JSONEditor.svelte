<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { codemirror } from '../../directives/json5Editor';
    import type { Extension } from '@codemirror/state';
    import { colorScheme } from '@web-apps/svelte-tabulator';

    type T = $$Generic<object>;
    export let value = {} as T;
    export let debounceInMs = 500;
    export let extensions: Extension[] = [];
    export let schema: {} = {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        $id: 'https://example.com/json-value.schema.json',
        title: 'Any JSON Value',
        description: 'A schema that allows any valid JSON value.',
        type: ['object', 'array', 'string', 'number', 'boolean', 'null'],
        properties: {},
        additionalProperties: true,
        items: {},
    };

    const dispatch = createEventDispatcher<{ changed: T; error: string }>();

    function onChanged(value: T) {
        dispatch('changed', value);
    }

    function onError(error: string) {
        dispatch('error', error);
    }
</script>

<div
    use:codemirror={{
        value,
        theme: $colorScheme,
        schema,
        extensions,
        debounceInMs,
        onChanged,
        onError,
    }}
></div>
