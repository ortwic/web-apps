<script lang="ts">
  import { t } from "svelte-i18n";
  import { onMount } from 'svelte';
  import Router, { push } from "svelte-spa-router";
  import { onAuthStateChanged } from 'firebase/auth';
  import { loadSettings, settingsStore } from "./lib/stores/settings.store";
  import { currentClientAuth, currentClientUser } from "./lib/stores/firebase.store";
  import Header from "./lib/components/Header.svelte";
  import Snackbar from "./lib/components/Snackbar.svelte";
  import Content from "./routes/content/Content.svelte";
  import Documents from "./routes/content/Documents.svelte";
  import Settings from "./routes/settings/Settings.svelte";
  import Schema from "./routes/manage/Schema.svelte";

  const routes = {
    '/': Schema,
    '/manage': Schema,
    '/list': Documents,
    '/content': Content,
    '/settings': Settings,
    // '*': NotFound
  };

  // ensure settings are loaded on client side only
  onMount(() => {
      const settings = loadSettings();
      settingsStore.set(settings);

      if ($currentClientAuth) {
          onAuthStateChanged($currentClientAuth, currentClientUser.set)
      }
      
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

<footer></footer>
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
