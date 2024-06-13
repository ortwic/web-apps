<script lang="ts">
	import { nanoid } from "nanoid";
    import { createStore } from "$lib/stores/fire.store";
    import type { EntityCollection } from "$lib/models/schema.model";
    import Edit from "./Edit.svelte";
    import Modal from "$lib/components/Modal.svelte";
    import { derived } from "svelte/store";
    import { info, error } from "$lib/stores/notification.store";
	
	let current: EntityCollection | null;
	let nameInput: HTMLInputElement;

	const store = createStore<EntityCollection>('__schema');
	const items = derived(store.documents, (items) => items.toSorted((a, b) => a.path.localeCompare(b.path)));

	async function add() {
		const path = nameInput.value;
		if (path) {	
			const id = `${path}-${nanoid(6)}`;
			const item: EntityCollection = {
				id,
				path,
				props: [],
			};
			nameInput.value = '';

			try {			
				return store.setDocument(item);
			} catch (ex: any) {
				error(ex.message);
			}
		}
		info('Path is required');
	}

	async function edit(ev: Event, item: EntityCollection) {
		ev.preventDefault();
		current = item;
	}

	async function remove(ev: Event, id: string) {
		ev.preventDefault();
		if (confirm('Are you sure?')) {
			return store.removeDocument(id);
		}
	}
</script>

<svelte:head>
	<title>Custom Firebase CMS</title>
	<meta name="description" content="Custom Firebase Content Management System" />
</svelte:head>

<section>
	<div class="grid">
		{#each $items as item}
		<a href="/p/{item.path}">
			<div class="item">
				<div title="{item.id}" class="actions">
					<button class="clear" on:click={(ev) => edit(ev, item)}><i class="bx bx-edit"></i></button>
					<button class="clear" on:click={(ev) => remove(ev, item.id)}><i class="bx bx-trash danger"></i></button>
				</div>
				<h2>{item.path}</h2>
				<div>
					<i class="bx bx-lg bx-right-arrow-alt"></i>
				</div>
			</div>
		</a>
		{/each}
		<div class="item">
			<div class="actions">
			</div>
			<input type="text" on:keydown={(e) => e.key === 'Enter' && add()} bind:this={nameInput} placeholder="Path" />			
			<button class="clear" on:click={add}>
				<i class="bx bx-plus"></i>
			</button>
		</div>
	</div>
</section>

<Modal open={!!current} title={current?.path} on:close={() => current = null}>
	<Edit item={current} />
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
		border-radius: .5rem;
		border: 1px solid gray;
	}

	div.actions {
		display: flex;
		justify-content: space-between;
		margin-left: auto;
		gap: 0;
	}

	div.actions > button {
		padding: .2rem;
	}
</style>
