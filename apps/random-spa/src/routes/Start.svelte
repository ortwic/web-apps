<script lang="ts">
    import { t } from 'svelte-i18n';
    import { fly } from 'svelte/transition';
    import { Accordion, AccordionItem } from 'svelte-collapsible'
    import { gameStore } from "../lib/firebase/game.store";
    import Game from './Game.svelte';

    // see https://developer.mozilla.org/en-US/docs/Web/CSS/transition-timing-function
    const easing = 'ease-in-out';
    const games = gameStore.documents;

    let selected: string | null;
</script>

<section transition:fly={{ x: -500, duration: 500 }}>
    <Accordion duration={.2} {easing} bind:key={selected}>
        {#each $games as game}
        <AccordionItem bind:key={game.id}>
            <h2 class="triangle-right" slot="header">
                <svg class="transition" class:red={game.id === selected} width="16" height="16" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <polygon points="0,0 80,50 0,100" fill="currentColor"/>
                </svg>
                {game.title}
                <ul class="chips">
                    {#each game.tags as tag}
                    <li>{ $t(tag) }</li>
                    {/each}
                </ul>
            </h2>
            <p class="body" slot="body">
                <Game {game} />
            </p>
        </AccordionItem>
        {/each}
    </Accordion>
</section>

<style>
    p.body {
        padding: 0 2em;
    }

    .transition {
        transition: all .2s ease-in-out;
    }

    .red {
        rotate: 90deg;
    }

    h2 {
        margin-bottom: 0;
    }

    .chips {
        display: flex;
        flex-wrap: wrap;
        list-style: none;
        margin: 0;
        padding: 0 0 0 1.5rem;
    }

    .chips li {
        border: 1px solid var(--primary-color);
        background-color: var(--bg-button);
        margin-top: .5rem;
        margin-bottom: 0;
        padding: .2rem .6rem;
        border-radius: 1rem;
        font-size: small;
        font-weight: normal;
    }
</style>
