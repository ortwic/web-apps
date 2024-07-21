<script lang="ts">
    import { onMount } from "svelte";
    import { slide } from "svelte/transition";
    import { getGroups } from "../lib/services/data.service";
    import Group from './Group.svelte';

    let activeGroup = null;

    onMount(() => {
        activeGroup = $groups[0];
    });

	const groups = getGroups();

    function toggleGroup(group: string) {
        activeGroup = activeGroup === group ? null : group;
    }
</script>

{#each $groups as group}
<p>
    <button on:click={() => toggleGroup(group)}>
        <h2>{group}</h2>
    </button>
    {#if activeGroup === group}
        <div in:slide={{ duration: 200 }} 
            out:slide={{ duration: 200 }}>
            <Group {group} />
        </div>
    {/if}
</p>
{/each}
