<script lang="ts">
    import { t } from 'svelte-i18n';
    import { link } from 'svelte-spa-router';
    import type { GameDescription } from '../lib/models';
    import { lang } from '../lib/i18n';
    import { marked } from 'marked';

    export let game: GameDescription;

    function description() {
      const desc = game.description_de && lang === 'de' 
            ? game.description_de 
            : game.description;
        return marked(desc);
    }

    function levels() {
        return game.levels_de && lang === 'de' 
            ? game.levels_de 
            : game.levels;
    }
</script>

<section>
  <p>{@html description()}</p>
  {#if levels()?.length > 1}
    <h3>{ $t('start.level') }</h3>
    <ul>
        <li>
            <a use:link href="/r/{game.id}/0">{ $t('start.all') }</a>
        </li>
          {#each levels() as item, i}
          <li>
              <a use:link href="/r/{game.id}/{i + 1}">{item}</a>
          </li>
          {/each}
    </ul>
  {:else}
    <a use:link href="/r/{game.id}/0">{ $t('start.start') }</a>
  {/if}
</section>

<style>
  ul {
    list-style: inside;
    padding: 0;
  }

  ul li {
    padding: .6rem 0;
  }
</style>
