<script lang="ts">
  import { onMount } from "svelte";
  import { t } from "svelte-i18n";
  import Router, { link } from "svelte-spa-router";
  import logoSrc from "/logo.svg";
  import Adsense from "./lib/ad/Adsense.svelte";
  import Start from './routes/Start.svelte';
  import Random from './routes/Random.svelte';
  import Page from "./routes/Page.svelte";
  import NotFound from './routes/NotFound.svelte';
  import { setupI18n } from './lib/i18n';

  const routes = {
    '/': Start,
    '/r/:path/:level/:dummy?': Random,
    '/p/:path': Page,
    '*': NotFound
  };

  let logoImg: HTMLImageElement;

  onMount(animateLogo);

  function animateLogo() {
    if (logoImg?.classList) {
      logoImg.classList.toggle('shake-ani');
      setTimeout(() => logoImg?.classList.remove('shake-ani'), 1600);
      setTimeout(animateLogo, Math.random() * 4000 + 8000);
    }
  }
</script>

<svelte:head>
  <meta name="author" content="OCSoft, ocsoft42@gmail.com">
  <title>Randomizer App - Shaking it all up!</title>
</svelte:head>

<header title="Shaking it all up!">
  <a use:link href="/" class="logo" title="Home">
    <img class="shake shake-ani" bind:this={logoImg} src={logoSrc} width="60" alt="Shaking it all up!" />
  </a>
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
    <span>&copy; <a use:link href="/p/imprint">{new Date().getFullYear()} OCSoft42</a></span>
    | <a use:link href="/p/privacy">{ $t('start.privacy') }</a>
    | <a use:link href="/p/termsofuse">{ $t('start.termsofuse') }</a>
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

  .logo {
    transition: transform .2s ease-in-out;
    transform-origin: 60% 80%;
    margin: 0 1em;
  }

  .logo:hover {
    transform: rotate(18deg);
  }

  .shake {
    transition: transform .2s linear;
    transform-origin: 70% 90%;
  }

  .shake:hover, .shake-ani {
    animation: shake .5s infinite;
  }

  @keyframes shake {
    0%, 100% { transform: rotate(0deg); }
    10%, 30% { transform: rotate(3deg); }
    40%, 50% { transform: rotate(-3deg); }
    60%, 80% { transform: rotate(3deg); }
    90% { transform: rotate(-3deg); }
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
    padding: .4rem 0;
  }

  footer > div * {
    font-weight: normal;
    white-space: nowrap;
  }
</style>