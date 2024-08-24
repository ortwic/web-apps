<script lang="ts">
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
        <AccordionItem bind:key={game.path}>
            <h2 class="triangle-right" slot="header">
                <svg class="transition" class:red={game.path === selected} width="16" height="16" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <polygon points="0,0 80,50 0,100" fill="currentColor"/>
                </svg>
                {game.title}
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
</style>
