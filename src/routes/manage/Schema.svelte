<script lang="ts">
    import { derived, writable } from 'svelte/store';
    import { nanoid } from 'nanoid';
    import type { EntityCollection } from '$lib/models/schema.model';
    import { showInfo, showError } from '$lib/stores/notification.store';
    import { currentClientUser } from '$lib/stores/firebase.store';
    import { createSchemaStore } from '$lib/stores/firestore.store';
    import Modal from '$lib/components/Modal.svelte';
    import CollectionEditor from './CollectionEditor.svelte';

    const schemaStore = createSchemaStore();
    const disabled = !$currentClientUser;

    let current = writable<EntityCollection | undefined>();
    let nameInput: HTMLInputElement;
    const documents = derived($schemaStore.documents, (docs) =>
        docs.toSorted((a, b) => a.path.localeCompare(b.path))
    );

    async function add() {
        const path = nameInput.value;
        if (path) {
            const id = `${path}-${nanoid(6)}`;
            const item: EntityCollection = {
                id,
                path,
                props: {}
            };
            nameInput.value = '';

            try {
                return $schemaStore?.setDocument(item);
            } catch (ex: any) {
                showError(ex.message);
            }
        } else {
            showInfo('Path is required');
        }
    }

    async function edit(ev: Event, item: EntityCollection) {
        ev.preventDefault();
        current.set(item);;
    }

    async function remove(ev: Event, id: string) {
        ev.preventDefault();
        if (confirm('Are you sure?')) {
            return $schemaStore?.removeDocument(id);
        }
    }
</script>

<section>
    <div class="grid">
        {#each $documents as item}
            <a href="/p/{item.path}">
                <div class="item emphasis">
                    <div title={item.id} class="actions">
                        <button {disabled} class="clear" on:click={(ev) => edit(ev, item)}>
                            <i class="bx bx-edit"></i>
                        </button>
                        <button {disabled} class="clear" on:click={(ev) => remove(ev, item.id)}>
                            <i class="bx bx-trash danger"></i>
                        </button>
                    </div>
                    <h2>{item.path}</h2>
                    <div>
                        <i class="bx bx-lg bx-right-arrow-alt"></i>
                    </div>
                </div>
            </a>
        {/each}
        <div class="item">
            <div class="actions"></div>
            <input {disabled}
                type="text"
                on:keydown={(e) => e.key === 'Enter' && add()}
                bind:this={nameInput}
                placeholder="Path"
            />
            <button {disabled} class="clear" on:click={add}>
                <i class="bx bx-plus"></i>
            </button>
        </div>
    </div>
</section>

<Modal open={!!$current} on:close={() => (current.set(undefined))}>
    {#if $current}
    <CollectionEditor item={$current} />
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
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 1rem;
        background-color: var(--color-bg-2);
        color: var(--color-text);
        border-radius: 0.5rem;
        border: 1px solid gray;
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
