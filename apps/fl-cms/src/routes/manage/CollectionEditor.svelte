<script lang="ts">
    import json from 'json5';
    import { type Content, JSONEditor, Mode } from 'svelte-jsoneditor'
    import { Timestamp, DocumentReference, GeoPoint } from 'firebase/firestore';
    import type { Properties } from '../../lib/packages/firecms_core/types/properties';
    import type { EntityCollection } from '../../lib/models/schema.model';
    import { createSchemaStore, createStore } from '../../lib/stores/firestore.store';
    import { showError, showInfo } from '../../lib/stores/notification.store';
    import Toolbar from '../../lib/components/Toolbar.svelte';
    import CollectionEditorTable from './CollectionEditorTable.svelte';

    export let item: EntityCollection;
    let showJsonView = false;
    let properties = item.properties;

    const schemaStore = createSchemaStore();
    const currentStore = createStore(item.path);
    const documents = $currentStore.documents;

    async function saveCollection() {
        try {
            await $schemaStore.setDocuments(item);
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
        
        const inferredProps = await buildEntityPropertiesFromData($documents, getType);
        properties = { 
            ...item.properties, 
            ...inferredProps 
        };
        item.properties = properties;
    }

    function setProperties(content: Content) {
        if ('text' in content) {
            try {            
                item.properties = json.parse<Properties>(content.text);
            } catch (error) {
                showError(`Invalid JSON: ${error}`);
            }
        }
    }

    function toggleEditView() {
        showJsonView = !showJsonView;
    }
</script>

<Toolbar>
    <button title="Save properties" class="icon clear" on:click={saveCollection}>
        <i class="bx bx-save"></i>
    </button>
    <button title="Infer from data" class="icon clear" on:click={appendInferredPropsFromData}>
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
