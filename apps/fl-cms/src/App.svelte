<script lang="ts">
  import { t } from "svelte-i18n";
  import { onMount } from 'svelte';
  import Router, { push } from "svelte-spa-router";
  import { loadSettings, settingsStore } from "./lib/stores/settings.store";
  import Header from "./lib/components/common/Header.svelte";
  import Snackbar from "./lib/components/common/Snackbar.svelte";
  import Config from "./routes/Config.svelte";
  import Document from "./routes/Page.svelte";
  import Media from "./routes/Media.svelte";
  import Settings from "./routes/Settings.svelte";
  import Index from "./routes/Index.svelte";
  import NotFound from "./routes/NotFound.svelte";

  const routes = {
    '/': Index,
    '/config/*': Config,
    '/page': Index,
    '/page/*': Document,
    '/media': Media,
    '/media/*': Media,
    '/settings': Settings,
    '*': NotFound
  };

  // ensure settings are loaded on client side only
  onMount(() => {
      const settings = loadSettings();
      settingsStore.set(settings);
      
      if (!settings.selectedProjectId) { 
          push('/settings');
      }
  });
</script>

<svelte:head>
    <link href="https://unpkg.com/boxicons@2.0.7/css/boxicons.min.css" rel="stylesheet" />
</svelte:head>

<Header />

<main>
  <Router {routes}/>
</main>

<footer>
     <div class="image-caption" style="text-align: right;">&copy; 
        <a href="https://github.com/ortwic/web-apps/tree/main/apps/fl-cms" target="_blank" rel="noopener noreferrer">OCSoft42</a> 
        &mdash; MIT License 
    </div>
</footer>
<Snackbar />

<style>
    main {
        flex: 1;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
    }

    footer {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 12px;
    }

    @media (min-width: 480px) {
        footer {
            padding: 12px 0;
        }
    }
</style>
