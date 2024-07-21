<script lang="ts">
    import { derived } from "svelte/store";
    import { pop } from "svelte-spa-router";
    import { gameStore } from "../lib/firebase/game.store";
    import { marked } from "marked";
    import { lang } from "../lib/i18n";
    import { buildStore } from "../lib/firebase/firestore.builder";
    import type { GameContent, GameDescription } from "../lib/models";
    import { randomNumberStore } from "../lib/random.store";

    export let params: { 
        path?: string,
        level?: number 
    } = {};

    const contentStore = buildStore<GameContent>(params.path);
    const byLevel = (level: number) => (!isNaN(level)
        ? (content: GameContent) => content.level === level 
        : () => true);
    const documents = derived(contentStore.documents, (docs) => docs.filter(byLevel(+params.level)));
    const levels = derived(gameStore.documents, getLevels);
    
    const randomIndex = randomNumberStore();
    $: randomIndex.set($documents.length);

    const entry = derived([documents, randomIndex], ([docs, index]) => docs[index]);
    const content = derived(entry, (e) => (e && e.content_de && lang === 'de' ? e.content_de : e?.content));

    function getLevels(games: GameDescription[]) {
        const game = games.find((g) => g.path === params.path);
        return game && game.levels_de && lang === 'de' ? game.levels_de : game?.levels ?? [];
    }
</script>

{#if $entry}
    {#if $levels.length > 1}
    <h2>
        {$levels[$entry.level]} 
        {#if import.meta.env.DEV}
            {$randomIndex + 1} / {$documents.length}
        {/if}
    </h2>
    {/if}
    <p>
        {@html marked($content, { mangle: false, headerIds: false })}
    </p>
{/if}
<button on:click={() => pop()}>Back</button>
<button on:click={() => randomIndex.set($documents.length)}>Next</button>
