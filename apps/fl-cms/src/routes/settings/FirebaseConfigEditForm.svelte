<script lang="ts">
    import json from 'json5';
    import { onMount } from 'svelte';
    import { querystring } from 'svelte-spa-router';
    import type { FirebaseOptions } from 'firebase/app';
    import { currentFirebaseConfig, removeFirebaseConfig, saveFirebaseConfig } from '../../lib/stores/settings.store';
    import { showError, showInfo } from '../../lib/stores/notification.store';

    const placeholder = `const firebaseConfig = {
  "apiKey": "AIzaSy...DGo4k",
  "authDomain": "myapp-project-123.firebaseapp.com",
  "databaseURL": "https://myapp-project-123.firebaseio.com",
  "projectId": "myapp-project-123",
  "storageBucket": "myapp-project-123.appspot.com"
  "appId": "1:123456789:web:ec2e...94d0"
};`;

    let textInput = '';
    let config: FirebaseOptions | undefined;

    onMount(() => setConfigFromUrl());

    function setConfigFromUrl() {
        if($querystring) {
            const params = new URLSearchParams($querystring);
            const projectId = params.get('projectId');
            const apiKey = params.get('apiKey');
            if (projectId && apiKey) {
                const authDomain = `${projectId}.firebaseapp.com`;
                config = { projectId, apiKey, authDomain };
                setCurrentConfig(config);
            }
        }
    }

    function setCurrentConfig(config: FirebaseOptions) {
        textInput = config?.projectId ? json.stringify(config, null, 2) : '';
    }

    function validateJson(text: string) {
        try {
            const configString = text?.match(/\{.+\}/s)?.at(0);
            if (configString) {
                config = json.parse<FirebaseOptions>(configString);
                return 'apiKey' in config && 'authDomain' in config && 'projectId' in config;
            }
        } catch {
            showError('Invalid Firebase config');
        } 
        return false;
    }

    function share(e: Event) {
        e.preventDefault();

        if (config?.projectId) {
            const url = `${window.location}?projectId=${config.projectId}&apiKey=${config.apiKey}`;
            navigator.clipboard.writeText(url);
            showInfo(`Copied ${url} to clipboard`);
        }
    }

    function save(e: Event) {
        e.preventDefault();
        
        if (config?.projectId && valid) {
            saveFirebaseConfig(config.projectId, config);
            showInfo(`Firebase config added for ${config.projectId}`);
        }
    }

    function remove(e: Event) {
        e.preventDefault();

        if (config?.projectId) {
            removeFirebaseConfig(config.projectId);
            textInput = '';
        }
    }

    $: setCurrentConfig($currentFirebaseConfig);
    $: valid = validateJson(textInput);
</script>

<form class="y-flex">
    <p class="info">
        Firebase project configurations are stored locally in your browser only.
    </p>
    <div class="x-flex-full">
        <label for="firebaseConfig">
            Save <a href="https://firebase.google.com/docs/web/setup" target="_blank">Firebase</a> config by projectId
        </label>
        <span class="x-flex-full">
            <button type="button" class="clear" on:click={share} disabled={!valid}>
                <i class="bx bx-share-alt"></i>
            </button>
            <button type="button" class="clear" on:click={save} disabled={!valid}>
                <i class="bx bx-save"></i>
            </button>
            <button type="button" class="clear" on:click={remove} disabled={!valid}>
                <i class="bx bx-trash danger"></i>
            </button>
        </span>
    </div>
    <textarea id="firebaseConfig" bind:value={textInput} {placeholder} rows="10"></textarea>
</form>

<style>
    textarea {
        width: calc(100% - 6px);
        min-width: 24rem;
        text-wrap: nowrap;
    }

    button {
        padding: .4rem;
    }
</style>
