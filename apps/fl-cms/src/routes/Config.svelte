<script lang="ts">
    import { params } from "svelte-spa-router";
    import { combineLatest, of, switchMap } from "rxjs";
    import CollectionEditor from "../lib/components/schema/CollectionEditor.svelte";
    import { createSchemaStore } from "../lib/stores/db/firestore.store";
    import { fromStore } from "../lib/utils/rx.store";

    const schemaStore = createSchemaStore();
    const schema = combineLatest([
        fromStore(schemaStore),
        fromStore(params)
    ]).pipe(switchMap(([store, p]) => p?.wild ? store.getCollectionFromSchemaPath(...p?.wild.split('/')) : of(null)));
</script>

<svelte:head>
    <title>Firebase CMS | Config</title>
</svelte:head>

{#if $schema}
{#key $schema.path}
<CollectionEditor item={$schema} />
{/key}
{:else}
<p>Config for schema with schematic path '{$params?.wild}' not found</p>
{/if}