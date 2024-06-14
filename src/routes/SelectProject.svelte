<script lang="ts">
    import { CONFIG_KEY } from "$lib";
    import { setFirebaseConfig } from "$lib/stores/clientApp.store";
    import { showError } from "$lib/stores/notification.store";

	const serializedConfigs = getAllProjectConfigs();
	let currentProject = Object.keys(serializedConfigs).at(0);

	function getAllProjectConfigs(): Record<string, string> {
		const value = localStorage.getItem(CONFIG_KEY);
		return value ? JSON.parse(value) : {};
	}

	$: if (currentProject) {
        try {
            const config = JSON.parse(serializedConfigs[currentProject]);
            setFirebaseConfig(config, currentProject);
        } catch (error) {
            showError('Unable to read firebase configuration');
        }
    }
</script>

<select name="config" bind:value={currentProject}>
	{#each Object.keys(serializedConfigs) as name}
	<option value={name}>{name}</option>
	{/each}
</select>


<style>
    select, option {
        padding: .2rem;
        min-width: 6rem;
    }
</style>