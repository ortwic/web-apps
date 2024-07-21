<script lang="ts">
    import { t } from 'svelte-i18n';
    import type { GameDescription } from '../lib/models';
    import { lang } from '../lib/i18n';

    export let game: GameDescription;

    function description() {
        return game.description_de && lang === 'de' 
            ? game.description_de 
            : game.description;
    }

    function levels() {
        return game.levels_de && lang === 'de' 
            ? game.levels_de 
            : game.levels;
    }
</script>

<section>
  <p>{description()}</p>
  {#if levels().length > 1}
    <h3>{ $t('start.level') }</h3>
    <ul>
        <li>
            <a href="#/r/{game.path}">{ $t('start.all') }</a>
        </li>
          {#each levels() as item, i}
          <li>
              <a href="#/r/{game.path}/{i}">{item}</a>
          </li>
          {/each}
    </ul>
  {:else}
    <a href="#/r/{game.path}">{ $t('start.start') }</a>
  {/if}
</section>

<style>
  ul {
    list-style: none;
    padding: 0;
  }

  ul li {
    padding: .6rem 0;
  }
</style>
