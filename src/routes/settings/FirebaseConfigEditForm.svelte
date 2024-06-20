<script lang="ts">
    import json from 'json5';
    import type { FirebaseOptions } from 'firebase/app';
    import { currentFirebaseConfig, removeFirebaseConfig, saveFirebaseConfig } from '$lib/stores/appSettings.store';
    import { showError, showInfo } from '$lib/stores/notification.store';

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

    function save() {
        if (config?.projectId && valid) {
            saveFirebaseConfig(config.projectId, config);
            showInfo(`Firebase config added for ${config.projectId}`);
        }
    }

    function remove() {
        if (config?.projectId) {
            removeFirebaseConfig(config.projectId);
            textInput = '';
        }
    }

    $: setCurrentConfig($currentFirebaseConfig);
    $: valid = validateJson(textInput);
</script>

<form class="y-flex">
    <div class="x-flex-full">
        <label for="firebaseConfig">
            Save <a href="https://firebase.google.com/docs/web/setup" target="_blank">Firebase</a> config by projectId
        </label>
        <span class="x-flex-full">
            <button class="clear" on:click={save} disabled={!valid}>
                <i class="bx bx-save"></i>
            </button>
            <button class="clear" on:click={remove} disabled={!valid}>
                <i class="bx bx-trash"></i>
            </button>
        </span>
    </div>
    <textarea id="firebaseConfig" bind:value={textInput} {placeholder} rows="10"></textarea>
    <p class="info">
        Config is stored locally in your browser. It is not sent to Firebase.
    </p>
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

    i.bx-trash {
        color: red;
    }
</style>
