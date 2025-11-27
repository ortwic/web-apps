<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { EnumValueConfig, EnumValues } from "../../packages/firecms_core/types/properties.simple";

    export let id = '';
    export let value: string;
    export let options: EnumValues | undefined;
    export let disabled = false;

    const dispatch = createEventDispatcher<{ changed: string }>();

    $: normalizedOptions = Array.isArray(options) 
        ? <EnumValueConfig[]>options.map(item => ({ 
            id: item.id ?? item, 
            label: item.label ?? item 
        })) 
        : options && Object.entries(options).map(([id, item]) => ({ 
            id, 
            label: typeof item === 'string' ? item : item.label
        })) || [];
    
    function change(ev: Event & { currentTarget: HTMLSelectElement; }) {
        dispatch('changed', ev.currentTarget.value);
    }
</script>


<select {id} {disabled} {value} on:change={(ev) => change(ev)}>
    {#each normalizedOptions as { id, label }}
    <option value="{id}">{label}</option>
    {/each}
</select>