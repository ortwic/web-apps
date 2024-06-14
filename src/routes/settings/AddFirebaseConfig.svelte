<script lang="ts">
    import { showError, showInfo } from "$lib/stores/notification.store";
    import { CONFIG_KEY } from "$lib";

	const placeholder = `const firebaseConfig = {
  "apiKey": "AIzaSy...DGo4k",
  "authDomain": "myapp-project-123.firebaseapp.com",
  "databaseURL": "https://myapp-project-123.firebaseio.com",
  "projectId": "myapp-project-123",
  "storageBucket": "myapp-project-123.appspot.com",
  "messagingSenderId": "123456789",
  "appId": "1:123456789:web:ec2e...94d0",
  "measurementId": "G-12345"
};`

    let valid = false;
    let textInput = '';
    let projectName = '';
	let projectConfig: string | undefined;

    function validateJson(text: string) {
        try {
            projectConfig = text?.match(/\{.+\}/s)?.at(0)?.replace(/\s*(\w+):\s?"/g, '"$1":"');
			if (projectConfig) {
                const config = JSON.parse(projectConfig);
				return 'apiKey' in config;
			}
        } catch {
            showError('Invalid Firebase config');
        }
        return false;
    }

    function add() {
        const config = localStorage.getItem(CONFIG_KEY) ?? '{}';
        localStorage.setItem(CONFIG_KEY, JSON.stringify({
            ...JSON.parse(config),
            [projectName]: projectConfig,
        }));
        projectName = '';
        showInfo(`Firebase config added for ${projectName}`);
    }

    $: valid = validateJson(textInput) && !!projectName;
</script>

<form method="post" action="?/updateConfig">
    <label for="projectName">Project name</label>
    <input id="projectName" type="search" bind:value={projectName} placeholder="Project name" />
    <div id="action">
        <label for="firebaseConfig">
            <a href="https://firebase.google.com/" target="_blank">Firebase</a> config
        </label> 
        <button on:click={add} disabled={!valid}>
            <i class="bx bx-plus"></i>
            Add
        </button>
    </div>
    <textarea id="firebaseConfig" bind:value={textInput} {placeholder} rows="11"></textarea>
</form>

<style>
    form {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: .6rem;
    }

    input {
        width: 100%;
        min-width: 24rem;
    }

	textarea {
		width: calc(100% - 6px);
		min-width: 24rem;
		text-wrap: nowrap;
	}

    #action {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: left;
    }

	button {
		padding: .4rem .8rem;
	}
</style>
