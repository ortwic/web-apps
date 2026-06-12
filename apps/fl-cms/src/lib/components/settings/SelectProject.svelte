<script lang="ts">
    import { saveSelectedProjectId, settingsStore } from '../../stores/settings.store';

    export let disabled = false;
    export let width = '6rem';

    function selectProject(ev: Event) {
        const target = ev.target as HTMLSelectElement;
        if (target?.value) {
            saveSelectedProjectId(target.value);
        }
    }
</script>

<select style:width={width} {disabled} name="config" 
    value={$settingsStore.selectedProjectId} on:change={selectProject}>
    {#each Object.entries($settingsStore.firebaseConfigs) as [value, config]}
        <option {value}>{value}</option>
    {/each}
</select>

<style>
    select,
    option {
        padding: 0.2rem;
    }
</style>
