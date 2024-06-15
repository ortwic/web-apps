<script lang="ts">
    import { loadSettings, saveSelectedProjectId, settingsStore } from '$lib/stores/appSettings.store';

    settingsStore.set(loadSettings());

    function selectProject(ev: Event) {
        const target = ev.target as HTMLSelectElement;
        if (target?.value) {
            saveSelectedProjectId(target.value);
        }
    }
</script>

<select name="config" value={$settingsStore.selectedProjectId} on:change={selectProject}>
    {#each Object.keys($settingsStore.firebaseConfigs) as projectId}
        <option value={projectId}>{projectId}</option>
    {/each}
</select>

<style>
    select,
    option {
        padding: 0.2rem;
        min-width: 6rem;
    }
</style>
