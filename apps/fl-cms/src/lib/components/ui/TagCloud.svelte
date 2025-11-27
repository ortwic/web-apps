<script lang="ts">
  import { createEventDispatcher, tick } from "svelte";
  import { confirmed } from "../../utils/ui.helper";

  export let labels: string[];

  const dispatch = createEventDispatcher<{ change: string[] }>();
  let editRefs: Array<HTMLElement | null> = [];

  async function add() {
    labels = [...labels, ""];

    await tick();
    const el = editRefs[labels.length - 1];
    el?.focus();
  }

  function update(event: Event & { currentTarget: EventTarget & HTMLSpanElement; }, i: number) {
    labels[i] = event.currentTarget.innerText;
    dispatch("change", labels);
    event.currentTarget.blur();
  }

  function remove(tag: string) {
    labels = labels.filter(t => t !== tag);
    dispatch("change", labels);
  }
</script>

<div class="tag-cloud">
  {#each labels as value, i}
    <span class="label">
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <span contenteditable="true" bind:this={editRefs[i]}
        on:keyup={(ev) => confirmed(ev) && update(ev, i)}
        on:blur={(ev) => update(ev, i)}>
        {value}
      </span>
      <button class="remove" on:click={() => remove(value)}>×</button>
    </span>
  {/each}
  <button class="icon clear" on:click={add}><i class="bx bx-plus"></i></button>
</div>

<style>
  .tag-cloud {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  span[contenteditable="true"] {
    cursor: text;
    outline: none;
  }

  .remove {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.9rem;
  }
</style>
