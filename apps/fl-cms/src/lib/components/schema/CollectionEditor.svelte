<script lang="ts">
    import { switchMap } from 'rxjs';
    import { push } from 'svelte-spa-router';
    import type { Properties } from '../../packages/firecms_core/types/properties.simple';
    import { templates } from '../../schema/predefined-collections';
    import { createValidator } from '../../schema/schema-validation';
    import type { Collection, Entity } from '../../models/schema.type';
    import { currentClientUser } from '../../stores/app.store';
    import { createSchemaStore, createDocumentStore } from '../../stores/db/firestore.helper';
    import { showError, showInfo } from '../../stores/notification.store';
    import Expand from '../ui/Expand.svelte';
    import PopupMenu from '../ui/PopupMenu.svelte';
    import Toolbar from '../ui/Toolbar.svelte';
    import JSONEditor from '../ui/JSONEditor.svelte';
    import Breadcrumb from '../ui/Breadcrumb.svelte';
    import schema from '../../schema/generated/property-record.schema.json';

    export let item: Collection;
    let dirty = false;
    let properties = item.properties || {};
    let templateMenu: PopupMenu;
    let validationMessages: string[] = [];

    $: disabled = !$currentClientUser;

    const schemaStore = createSchemaStore();
    const service = createDocumentStore(item.path);
    const documents = service.pipe(switchMap(s => s.getDocumentStream()));
    const { validate, validationErrors } = createValidator(schema);

    async function saveCollection() {
        try {
            await $schemaStore.updateProperties(item, false);
            showInfo(`${item.path} saved`);
            dirty = false;
            if (window.history.length) {
                window.history.back();
            }
        } catch (error) {
            showError(`${error}`);
        }
    }
        
    async function appendInferredPropsFromData(documents: Entity[]) {
        const { buildEntityProperties } = await import('../../schema/inference.helper');
        properties = { 
            ...item.properties, 
            ...await buildEntityProperties(documents) 
        };
        item.properties = properties;
    }

    function loadTemplate(key: string) {
        properties = templates[key].properties;
        item.properties = properties;
        dirty = true;
    }

    function setProperties<T>(props: T) {
        if (validate(props) || import.meta.env.DEV) {
            item.properties = props as Properties;
            validationMessages = [];
            dirty = true;
        } else if (validate.errors) {
            validationMessages = validationErrors(props);
        }
    }
</script>

<header>
    <Toolbar showNav={true}>
        <button disabled={disabled || !dirty} title="Save properties" class="icon clear" on:click={saveCollection}>
            <i class="bx bx-save hl"></i>
        </button>
        <button title="From templates" class="icon clear" on:click={(ev) => templateMenu.showPopupMenu(ev)}>
            <i class="bx bxs-box"></i>
        </button>
        <button title="Infer from data" class="icon clear" disabled={!!item.parent} on:click={() => appendInferredPropsFromData($documents)}>
            <i class="bx bxs-magic-wand"></i>
        </button>
        <slot name="commands"></slot>
        <span slot="title">
            <Breadcrumb path={item.path} rootPath="/config" on:navigate={({ detail: path }) => push(`/${path}`)} />
        </span>
    </Toolbar>
</header>

<div class="input">
    <JSONEditor value={properties} {schema}
        on:changed={({ detail }) => setProperties(detail)} 
        on:error={({ detail }) => validationMessages = [detail]} />
</div>

<div class="validation">
    <Expand>
        <span slot="header" class="emphasis">Validation output</span>
        <textarea readonly>{validationMessages.join('\n')}</textarea>
    </Expand>
</div>

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
    .input {
        min-height: 12em;
    }

    .validation {
        position: sticky;
        left: 0;
        right: 0;
        bottom: 0;
        max-height: 30%;
        background-color: var(--color-bg-2);
        border: 1px solid var(--color-bg-0);

        textarea {
            white-space: pre;
            overflow-wrap: normal;
            width: calc(100% - 2.6em);
            min-height: 12em;
            height: 100%;
        }
    }
</style>