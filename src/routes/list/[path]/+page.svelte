<script lang="ts">
    import { createSchemaStore, createStore } from '$lib/stores/firestore.store.js';
    import Table from '$lib/components/table/Table.svelte';
    import Toolbar from '$lib/components/Toolbar.svelte';
    import { prepareColumnDefinitions } from '$lib/components/table/column.helper.js';
    export let data;

    const schemaStore = createSchemaStore();
    const currentStore = createStore(data.path);
    const documents = $currentStore.documents;
    const columnPromise = $schemaStore.getDocument(data.path)
        .then(entities => prepareColumnDefinitions(entities, { maxWidth: 800, maxHeight: 300 } ));
    
</script>

<Toolbar>
    <span slot="title">{data.path}</span>
</Toolbar>

<section>
    {#await columnPromise}
    <p>Loading...</p>
    {:then columns}
    <Table idField="id" {columns} data={documents} persistenceID={data.path} />
    {/await}
</section>