<script lang="ts">
  import { t } from "svelte-i18n";
  import Router from "svelte-spa-router";
  import logo from "/logo.svg";
  import Adsense from "./lib/ad/Adsense.svelte";
  import Start from './routes/Start.svelte';
  import Random from './routes/Random.svelte';
  import Page from "./routes/Page.svelte";
  import NotFound from './routes/NotFound.svelte';
  import { setupI18n } from './lib/i18n';

  const routes = {
    '/': Start,
    '/r/:path': Random,
    '/r/:path/:level': Random,
    '/p/:path': Page,
    '*': NotFound
  };
</script>

<svelte:head>
  <meta name="author" content="OCSoft, ocsoft42@gmail.com">
  <title>Randomizer App - Shaking it all up!</title>
</svelte:head>

<header title="Shaking it all up!">
  <a href="/"><img src={logo} width="100" alt="Shaking it all up!" /></a>
  <h1>
    Randomizer
  </h1>
</header>

{#await setupI18n()}
  loading...
{:then} 
<main>

  <Router {routes}/>

  <!-- <Snackbar /> -->
</main>

<footer>
  <Adsense adSlot="0000000" adClient="ca-pub-2477798570332878" />
  <div>
    <span>&copy; <a href="#/p/imprint">{new Date().getFullYear()} OCSoft42</a></span>
    | <a href="#/p/privacy">{ $t('start.privacy') }</a>
    | <a href="#/p/termsofuse">{ $t('start.termsofuse') }</a>
  </div>
</footer>

{:catch error}
<p>
  Error while loading translations: <br />
  { error }
</p>
{/await}

<style>
  header {
      padding: 1em;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
  }

  footer {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    max-height: 20vh;
    text-align: center;
    background-color: var(--bg-color);
  }

  footer > div {
    padding: .4rem;
  }

  footer > div > * {
    white-space: nowrap;
  }
</style>