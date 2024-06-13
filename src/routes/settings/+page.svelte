<script lang="ts">
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
	let configInput = '';
	let configText = '';

    function validateJson(text: string) {
        try {
			const json = text.match(/\{.+\}/s)?.at(0);
			if (json) {
				const config = JSON.parse(json);
				configText = json;
				return 'apiKey' in config;
			}
        } catch (error) {
            return false;
        }
    }

    // Call validateJson whenever configText changes
    $: valid = validateJson(configInput);
</script>

<svelte:head>
	<title>Settings</title>
	<meta name="description" content="Settings of this app" />
</svelte:head>

<div class="text-column">
	<form method="post" action="?/updateConfig">
		<h1>Settings</h1>

		<p>
			Paste your <a href="https://firebase.google.com/" target="_blank">Firebase</a> config here:
		</p>

		<textarea bind:value={configInput} {placeholder} rows="11"></textarea>
		<input type="hidden" name="config" value={configText} />

		<p>
			<input type="submit" value="Save" disabled={!valid} />
		</p>
	</form>
</div>

<style>
	textarea {
		width: 100%;
		min-width: 24rem;
		text-wrap: nowrap;
	}

	input[type="submit"] {
		margin-top: 1rem;
		padding: .4rem .8rem;
	}
</style>
