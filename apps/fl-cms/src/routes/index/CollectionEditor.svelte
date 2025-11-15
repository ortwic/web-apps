<script lang="ts">
    import json from 'json5';
    import { get } from 'svelte/store';
    import { type Content, JSONEditor, Mode } from 'svelte-jsoneditor'
    import { Timestamp, DocumentReference, GeoPoint } from 'firebase/firestore';
    import { colorScheme } from '@web-apps/svelte-tabulator';
    import type { Properties } from '../../lib/packages/firecms_core/types/properties';
    import { templates } from '../../lib/data/predefinedCollections';
    import type { Collection } from '../../lib/models/schema.model';
    import { createSchemaStore, createDocumentStore } from '../../lib/stores/db/firestore.store';
    import { showError, showInfo } from '../../lib/stores/notification.store';
    import PopupMenu from '../../lib/components/PopupMenu.svelte';
    import Toolbar from '../../lib/components/Toolbar.svelte';
    import CollectionEditorTable from './CollectionEditorTable.svelte';

    export let item: Collection;
    let showJsonView = true;
    let properties = item.properties || {};
    let templateMenu: PopupMenu;

    // Calculation of popup within a dialog element fails, so use static position as a workaround
    const staticTemplatePopupPosition = { clientX: 80, clientY: 50 } as MouseEvent;
    const schemaStore = createSchemaStore({ merge: false });
    const contentStore = createDocumentStore(item.path, { merge: false });
    const documents = $contentStore;

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
        
        const inferredProps = await buildEntityPropertiesFromData(get(documents), getType);
        properties = { 
            ...item.properties, 
            ...inferredProps 
        };
        item.properties = properties;
    }

    function loadTemplate(key: string) {
        properties = templates[key].properties;
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
    <button title="From templates" class="icon clear" on:click={(ev) => templateMenu.showPopupMenu(staticTemplatePopupPosition)}>
        <i class="bx bxs-box"></i>
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
<div class:jse-theme-dark={$colorScheme === 'dark'}>    
    <JSONEditor mainMenuBar={false} mode={Mode.text} content={{ json: properties }} onChange={setProperties} />
</div>
{:else}
    <CollectionEditorTable properties={properties} />
{/if}

<PopupMenu bind:this={templateMenu}>
    <div class="small popup-menu y-flex">
        <div class="center emphasis" style="margin:.4em .8em">&mdash; Load &mdash;</div>
        {#each Object.keys(templates) as key}
            <button class="btn" on:click={() => loadTemplate(key)}>
                <span class="emphasis"> {key}</span>
            </button>
        {/each}
    </div>
</PopupMenu>