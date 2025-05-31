<script lang="ts">
    import json from 'json5';
    import { get } from 'svelte/store';
    import { type Content, JSONEditor, Mode } from 'svelte-jsoneditor'
    import { Timestamp, DocumentReference, GeoPoint } from 'firebase/firestore';
    import type { Properties } from '../../lib/packages/firecms_core/types/properties';
    import type { Collection } from '../../lib/models/schema.model';
    import { createSchemaStore, createDocumentStore } from '../../lib/stores/firestore.store';
    import { showError, showInfo } from '../../lib/stores/notification.store';
    import Toolbar from '../../lib/components/Toolbar.svelte';
    import CollectionEditorTable from './CollectionEditorTable.svelte';

    export let item: Collection;
    let showJsonView = false;
    let properties = item.properties || {};

    const schemaStore = createSchemaStore();

    async function saveCollection() {
        try {
            await $schemaStore.updateProperties(item);
            showInfo(`${item.path} saved`);
        } catch (error) {
            showError(`${error}`);
        }
    }
        
    async function appendInferredPropsFromData() {
        const { buildEntityPropertiesFromData } = await import('../../lib/packages/schema_inference');
        const getType = (value: any) => {
            if (typeof value === "number")
                return "number";
            else if (typeof value === "string")
                return "string";
            else if (typeof value === "boolean")
                return "boolean";
            else if (Array.isArray(value))
                return "array";
            else if (value instanceof Timestamp)
                return "date";
            else if (value instanceof GeoPoint)
                return "geopoint";
            else if (value instanceof DocumentReference)
                return "reference";
            return "map";
        };
        
        const store = get(createDocumentStore(item.path)); // TODO path could be invalid here
        const inferredProps = await buildEntityPropertiesFromData(get(store), getType);
        properties = { 
            ...item.properties, 
            ...inferredProps 
        };
        item.properties = properties;
    }

    function setProperties(content: Content) {
        item.properties = parseProperties(content);
    }

    function parseProperties(content: Content): Properties {
        if ('text' in content) {
            try {            
                return json.parse<Properties>(content.text);
            } catch (error) {
                showError(`Invalid JSON: ${error}`);
            }
        }
        return {};
    }

    function toggleEditView() {
        showJsonView = !showJsonView;
    }
</script>

<Toolbar>
    <button title="Save properties" class="icon clear" on:click={saveCollection}>
        <i class="bx bx-save"></i>
    </button>
    <button title="Infer from data" class="icon clear" disabled={!!item.parent} on:click={appendInferredPropsFromData}>
        <i class="bx bxs-magic-wand"></i>
    </button>
    <button title="Toggle code view" class="icon clear" on:click={toggleEditView}>
        <i class="bx {showJsonView ? 'bx-list-ul' : 'bx-code-curly'}"></i>
    </button>
    <span slot="title">{item.path}</span>
</Toolbar>

{#if showJsonView}
    <JSONEditor mainMenuBar={false} mode={Mode.text} content={{ json: properties }} onChange={setProperties} />
{:else}
    <CollectionEditorTable properties={properties} />
{/if}
