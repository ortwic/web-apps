<script lang="ts">
    import { t } from "svelte-i18n";
    import { derived } from "svelte/store";
    import { fly } from "svelte/transition";
    import { swipe } from 'svelte-gestures';
    import { pop, push } from "svelte-spa-router";
    import { gameStore } from "../lib/firebase/game.store";
    import { marked } from "marked";
    import { lang } from "../lib/i18n";
    import { buildStore } from "../lib/firebase/firestore.builder";
    import type { GameContent, GameDescription } from "../lib/models";
    import { swipeTransitionStore } from "../lib/transition.store";
    import { randomIntegerStore } from "../lib/random.store";

    export let params: { 
        path?: string,
        level?: number
    } = {};

    const config = derived(gameStore.documents, (games) => games.find((g) => g.id === params.path));
    const levels = derived(config, getLevels);
    const data = buildStore<GameContent>(`${gameStore.path}/${params.path}/data`);
    const documents = derived(data.documents, (docs) => docs.filter(byLevel));
    
    const move = swipeTransitionStore({ x: 500, duration: 500, opacity: 1 });
    const randomIndex = randomIntegerStore();
    $: if ($documents.length) {
        randomIndex.create($documents.length, $config.repeat);
    }
    const entry = derived([documents, randomIndex], ([docs, index]) => docs[index]);
    const content = derived(entry, (e) => (e && e.content_de && lang === 'de' ? e.content_de : e?.content));

    function byLevel(content: GameContent) {
        const level = +params.level;
        return level ? content.level === level - 1 : true;
    }

    function getLevels(game: GameDescription) {
        return game && game.levels_de && lang === 'de' ? game.levels_de : game?.levels ?? [];
    }

    function prev() {
        move.left();
        randomIndex.prev();
        pop();
    }

    function next() {
        move.right();
        randomIndex.next();
        push(`/r/${$config.id}/${$entry.level + 1}/${$randomIndex}.${$documents.length}`);
    }

    function swiped({ direction }) {
        if (direction === 'left') {
            next();
        } else if (direction === 'right') {
            prev();
        }
    }
</script>

{#key $move}
<section class="absolute grid" in:fly={move.in} out:fly={move.out}
    use:swipe={{ timeframe: 500, minSwipeDistance: 50 }} on:swipe={(e) => swiped(e.detail)}>
    <button on:click={prev}>&lt;&lt; { $t('random.prev') }</button>
    <button on:click={next}>{ $t('random.next') } &gt;&gt;</button>
    <span class="col-2">
    {#if $entry}
        {#if $levels.length > 1}
        <h2>{$levels[$entry.level]} </h2>
        {/if}
        <p>
            {@html marked($content ?? '&lt;No translation found&gt;', { mangle: false, headerIds: false })}
        </p>
    {/if}
    </span>
</section>
{/key}

<style>
    section.grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-gap: 1em;
    }

    .col-2 {
        grid-column: span 2;
    }
</style>
