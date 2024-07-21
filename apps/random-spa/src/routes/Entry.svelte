<script lang="ts">
    import { pop } from "svelte-spa-router";
    import { getRandomEntry } from "../lib/services/data.service";
    import { marked } from "marked";

    export let params: { 
        group?: string,
        level?: string 
    } = {};

	const entry = getRandomEntry(params.group, params.level);
</script>

{#if $entry}
<h2>
    {$entry.level}
</h2>
<p>
    {@html marked($entry.content)}
</p>
<button on:click={() => pop()}>Back</button>
<button on:click={() => window.location.reload()}>Next</button>
{/if}
