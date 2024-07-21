<script lang="ts">
    import { onMount } from "svelte";
    import { slide } from "svelte/transition";
    import { gameStore } from "../lib/firebase/game.store";
    import Game from './Game.svelte';

    let selected = null;

    onMount(() => {
        selected = $games[0];
    });

    const games = gameStore.documents;

    function toggle(value: string) {
        selected = selected === value ? null : value;
    }
</script>

{#each $games as game}
<p>
    <button on:click={() => toggle(game.path)}>
        <h2>{game.title}</h2>
    </button>
    {#if selected === game.path}
        <div in:slide={{ duration: 200 }} 
            out:slide={{ duration: 200 }}>
            <Game {game} />
        </div>
    {/if}
</p>
{/each}
