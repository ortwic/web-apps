<script lang="ts">
    import { onMount } from 'svelte';
    import { link } from 'svelte-spa-router';
    import { derived, writable } from 'svelte/store';
    import type { Collection } from '../../lib/models/schema.model';
    import { showError, showWarn } from '../../lib/stores/notification.store';
    import { currentClientUser } from '../../lib/stores/app.store';
    import { createSchemaStore } from '../../lib/stores/db/firestore.store';
    import Modal from '../../lib/components/Modal.svelte';
    import CollectionEditor from './CollectionEditor.svelte';
    import SelectDocument from './SelectDocument.svelte';

    const schemaStore = createSchemaStore();
    const schemas = $schemaStore;
    $: disabled = !$currentClientUser;

    let showEdit = false, showSelect = false;
    let current = writable<Collection>();
    let currentPath = derived(current, (item) => item && item.pathSegments && item.pathSegments[0] || '');
    let pathInput: HTMLInputElement;

    onMount(() => {
        if (!$currentClientUser) {
            showWarn('You are not logged in: Read only mode.');
        }
    })

    async function add() {
        const path = pathInput.validity.valid && pathInput.value;
        if (!path) {
            return showWarn('Invalid collection name');
        }
        const exists = $schemas.some((item) => item.path === path);
        if (exists) {
            return showWarn('Collection already exists');
        }

        pathInput.value = '';

        try {
            return $schemaStore?.createCollections(path);
        } catch (ex: any) {
            showError(ex.message);
        }
    }

    async function edit(item: Collection) {
        showEdit = true;
        current.set(item);
    }

    function select(item: Collection) {
        showSelect = true;
        current.set(item);
    }

    async function remove(item: Collection) {
        let message = 'Are you sure?';
        if (item.subcollections) {
            const subs = item.subcollections.map((s) => `${item.id}/${s.id}`).join('\n');
            message += `\n\nWARNING! This collections will be removed too:\n${subs}`;
        }
        if (confirm(message)) {
            return $schemaStore?.removeCollections(item.path);
        }
    }
</script>

<svelte:head>
    <title>Firebase CMS</title>
    <meta name="description" content="Custom Firebase Content Management System" />
</svelte:head>

<section class="content-64">
    <div class="grid">
        {#each $schemas as item}
            <div class="flex-center item emphasis">
                <div title={item.path} class="actions">
                    <button {disabled} class="clear" on:click|preventDefault={() => edit(item)}>
                        <i class="bx bx-edit"></i>
                    </button>
                    <button {disabled} class="clear" on:click|preventDefault={() => remove(item)}>
                        <i class="bx bx-trash danger"></i>
                    </button>
                </div>
                {#if item.parent}
                <!-- svelte-ignore a11y-interactive-supports-focus -->
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <!-- svelte-ignore a11y-missing-attribute -->
                <a role="button" on:click|preventDefault={() => select(item)} class="flex-center pointer">
                    <h2>{item.path}</h2>
                    <span>
                        <i class="bx bx-lg bx-list-ul"></i>
                    </span>
                </a>
                {:else}
                <a use:link href="/list?{item.path}" class="flex-center">
                    <h2>{item.path}</h2>
                    <span>
                        <i class="bx bx-lg bx-right-arrow-alt"></i>
                    </span>
                </a>
                {/if}
            </div>
        {/each}
        <div class="flex-center item">
            <div class="actions"><br/></div>
            <input {disabled}
                type="text" pattern="[\w\/]+"
                on:keydown={(e) => e.key === 'Enter' && add()}
                bind:this={pathInput}
                placeholder="Collection"
            />
            <br/>
            <button {disabled} class="clear" on:click={add}>
                <i class="bx bx-plus"></i>
            </button>
        </div>
    </div>
</section>

<Modal open={showEdit} width="100%" on:close={() => (showEdit = false)}>
    {#if showEdit}
    <CollectionEditor item={$current} />
    {/if}
</Modal>

<Modal open={showSelect} width="14em" on:close={() => (showSelect = false)}>
    {#if showSelect}
    <SelectDocument item={$current} path={$currentPath} />
    {/if}
</Modal>

<style>
    section {
        display: flex;
        flex-direction: column;
        justify-content: top;
        align-items: center;
        flex: 0.6;
    }

    div.grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1rem;
        width: 100%;
        margin: 1rem 0;
    }

    div.item {
        background-color: var(--color-bg-2);
        color: var(--color-text);
        border-radius: 0.5rem;
        border: 1px solid gray;
        padding: 1rem;
    }

    div.item > input {
        padding: .5rem;
        text-align: center;
    }

    div.actions {
        display: flex;
        justify-content: space-between;
        margin-left: auto;
        gap: 0;
    }

    div.actions > button {
        padding: 0.2rem;
    }
</style>
