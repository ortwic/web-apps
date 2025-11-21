<script lang="ts">
    import { get } from 'svelte/store';
    import { Timestamp, DocumentReference, GeoPoint } from 'firebase/firestore';
    import type { Properties } from '../../packages/firecms_core/types/properties';
    import { templates } from '../../schema/predefinedCollections';
    import type { Collection, JSONValidationError } from '../../models/schema.model';
    import { createSchemaStore, createDocumentStore } from '../../stores/db/firestore.store';
    import { showError, showInfo } from '../../stores/notification.store';
    import Expand from '../ui/Expand.svelte';
    import PopupMenu from '../ui/PopupMenu.svelte';
    import Toolbar from '../ui/Toolbar.svelte';
    import CollectionEditorTable from './CollectionEditorTable.svelte';
    import JSONEditor from './JSONEditor.svelte';

    export let item: Collection;
    let showJsonView = true;
    let properties = item.properties || {};
    let templateMenu: PopupMenu;
    let messages: string[] = [];

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
        const { buildEntityPropertiesFromData } = await import('../../packages/schema_inference');
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

    function setProperties<T>(propsOrBuilder: T) {
        item.properties = propsOrBuilder as Properties;
    }

    function prepareValidation(errors: JSONValidationError) {
        messages = errors.syntax !== undefined ? [errors.syntax] : errors.schema ?? [];
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
    <!-- Feature not yet fully implemented -->
    {#if import.meta.env.DEV}
    <button title="Toggle code view" class="icon clear" on:click={toggleEditView}>
        <i class="bx {showJsonView ? 'bx-list-ul' : 'bx-code-curly'}"></i>
    </button>
    {/if}
    <span slot="title">{item.path}</span>
</Toolbar>

{#if showJsonView}
<div class="editor">
    <div class="input">
        <JSONEditor value={properties} on:changed={({ detail }) => setProperties(detail)} on:validated={({ detail }) => prepareValidation(detail)} />
    </div>
    <div class="validation">
        <Expand>
            <span slot="header" class="emphasis">Validation</span>
            <textarea readonly>{messages.join('\n')}</textarea>
        </Expand>
    </div>
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

<style lang="scss">
    .editor {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: .2em;
        height: calc(100% - 3.8rem);

        .input {
            min-height: 12em;
            height: 100%;
            overflow: auto;
            padding: 0;
        }

        .validation {
            max-height: 30%;
            width: 100%;

            textarea {
                width: calc(100% - 2.6em);
                min-height: 12em;
            }
        }
    }
</style>