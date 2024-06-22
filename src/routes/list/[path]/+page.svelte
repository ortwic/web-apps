<script lang="ts">
    import { JSONEditor, Mode } from 'svelte-jsoneditor'
    import type { Properties } from '$lib/packages/firecms_core/types/properties.js';
    import { createSchemaStore, createStore } from '$lib/stores/firestore.store.js';
    import Toolbar from '$lib/components/Toolbar.svelte';

    export let data;

    let properties = {} as Properties;

    const schemaStore = createSchemaStore();
    const currentStore = createStore(data.path);
    const documents = $currentStore.documents;

    $schemaStore.getDocument(data.path).then((collection) => {
        if (collection) {
            properties = collection.properties;
        }
    });
    
</script>

<Toolbar>
    <span slot="title">{data.path}</span>
</Toolbar>

<section>
    <JSONEditor mainMenuBar={false} mode={Mode.text} content={{ json: properties }} />
</section>
