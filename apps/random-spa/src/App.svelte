<script lang="ts">
  import { t } from "svelte-i18n";
  import Router from "svelte-spa-router";
  import logo from "/logo.svg";
  import Start from './routes/Start.svelte';
  import Entry from './routes/Entry.svelte';
  import NotFound from './routes/NotFound.svelte';
  import { setupI18n } from './lib/services/i18n';

  const routes = {
    '/': Start,
    '/r/:group/:level': Entry,
    '*': NotFound
  };
</script>

<svelte:head>
  <meta name="author" content="OCSoft, ocsoft42@gmail.com">
  <title>Randomizer App - Shaking it all up!</title>
</svelte:head>

<header>
  <img src={logo} width="100" alt="Shaking it all up!" />
  <h1>
      Randomizer
  </h1>
</header>

<main>
  {#await setupI18n()}
  loading...
  {:then} 

  <Router {routes}/>

  <!-- <Snackbar /> -->
  {:catch error}
  <p>
    Error while loading translations: <br />
    { error }
  </p>
  {/await}
</main>

<footer>
    &copy; {new Date().getFullYear()} OCSoft42
</footer>

<style>
  header {
      padding: 1em;
      display: flex;
      justify-content: center;
      align-items: center;
  }
  
  footer {
    position: absolute;
    bottom: 0;
    padding: 1em;
    display: block;
    width: auto;
  }
</style>