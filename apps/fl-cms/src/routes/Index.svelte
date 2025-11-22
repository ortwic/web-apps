<script lang="ts">
    import { onMount } from 'svelte';
    import { link } from 'svelte-spa-router';
    import { derived, writable } from 'svelte/store';
    import type { Collection } from '../lib/models/schema.model';
    import { showError, showWarn } from '../lib/stores/notification.store';
    import { currentClientUser } from '../lib/stores/app.store';
    import { createSchemaStore } from '../lib/stores/db/firestore.store';
    import Modal from '../lib/components/ui/Modal.svelte';
    import SelectCollection from '../lib/components/schema/SelectCollection.svelte';

    const schemaStore = createSchemaStore();
    const schemas = $schemaStore;

    $: disabled = !$currentClientUser;

    let showSelect = false;
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
    <title>Firebase CMS | Index</title>
    <meta name="description" content="Custom Firebase Content Management System" />
</svelte:head>

<section class="content-64">
    <div class="grid">
        {#each $schemas as item, i}
            <div class="flex-center item emphasis">
                <div class="actions">
                    <a role="button" class="icon clear" href="#/config/{item.path}" title="config {item.path}" 
                        use:link={`/config/${item.path}`} on:click|preventDefault={() => {}}>
                        <i class="bx bx-edit"></i>
                    </a>
                    <button {disabled} class="clear" title="delete {item.path}" 
                        on:click|preventDefault={() => remove(item)}>
                        <i class="bx bx-trash"></i>
                    </button>
                </div>
                {#if item.parent}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <a role="button" href="/page/{item.path}" tabindex={i} title="select {item.path}" 
                    on:click|preventDefault={() => select(item)} class="nav link flex-center pointer">
                    <h2>{item.path}</h2>
                    <span>
                        <i class="bx bx-lg bx-list-ul"></i>
                    </span>
                </a>
                {:else}
                <a role="button" use:link href="/page/{item.path}" class="nav flex-center" tabindex={i}>
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
                placeholder="New collection"
            />
            <br/>
            <button {disabled} class="clear" on:click={add}>
                <i class="bx bx-plus"></i>
            </button>
        </div>
    </div>
</section>

<Modal open={showSelect} width="14em" on:close={() => (showSelect = false)}>
    {#if showSelect}
    <SelectCollection item={$current} path={$currentPath} />
    {/if}
</Modal>

<style lang="scss">
section {
    display: flex;
    flex-direction: column;
    justify-content: top;
    align-items: center;
    flex: 0.6;

    div.grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1rem;
        width: 100%;
        margin: 1rem 0;

        div.item {
            background-color: var(--color-bg-2);
            color: var(--color-text);
            border-radius: 0.5rem;
            border: 1px solid gray;
            transition: border .25s ease-in-out;
            padding: 1rem;

            &:hover:has(a.nav), &:has(a.nav:hover) {
                border: 1px solid var(--color-theme-2);
            }

            & > input {
                padding: .5rem;
                text-align: center;
            }

            div.actions {
                display: flex;
                justify-content: space-between;
                margin-left: auto;
                gap: 0;
            
                & > button {
                    padding: 0.2rem;
                }
            }

            a[role="button"] {
                width: 98%;
                border: 0;

                &:not([disabled]):hover {
                    border: 0;
                }
            }
        }
    }
}
</style>
