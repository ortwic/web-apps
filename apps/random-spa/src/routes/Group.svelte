<script lang="ts">
    import { t } from 'svelte-i18n';

    import { getLevels } from "../lib/services/data.service";

    export let group: string;
	const levels = getLevels(group);
</script>

<section>
    <h3>{ $t('start.level') }</h3>
    <ul>
        {#each $levels as item}
        <li>
            <a href="#/r/{group}/{item}">{item}</a>
        </li>
        {/each}
    </ul>
</section>

<style>
  ul {
    list-style: none;
    padding: 0;
  }
</style>
