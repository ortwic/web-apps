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

    const config = derived(gameStore.documents, (games) => games.find((g) => g.id === params.path));
    const levels = derived(config, getLevels);
    
    const randomIndex = randomNumberStore(() => $config.repeat);
    $: randomIndex.set($documents.length);

    const data = buildStore<GameContent>(`${gameStore.path}/${params.path}/data`);
    const documents = derived(data.documents, (docs) => docs.filter(byLevel));
    const entry = derived([documents, randomIndex], ([docs, index]) => docs[index]);
    const content = derived(entry, (e) => (e && e.content_de && lang === 'de' ? e.content_de : e?.content));

    function byLevel(content: GameContent) {
        const level = +params.level;
        return !isNaN(level) ? content.level === level : true;
    }

    function getLevels(game: GameDescription) {
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
        {@html marked($content ?? '&lt;No translation found&gt;', { mangle: false, headerIds: false })}
    </p>
{/if}
<button on:click={() => pop()}>Back</button>
<button on:click={() => randomIndex.set($documents.length)}>Next</button>
