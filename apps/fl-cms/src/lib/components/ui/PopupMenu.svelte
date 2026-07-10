<script lang='ts'>
  import { createEventDispatcher, onDestroy } from "svelte";
  import { fade } from "svelte/transition";

  const dispatch = createEventDispatcher()

  export let width: string | number = "auto";
  let menu: HTMLDivElement;
  let clientX = 0, clientY = 0;
  let left: string | number, top: string | number, offsetWidth: number, offsetHeight: number;
  let visible = false;
    
  onDestroy(() => {
    document.removeEventListener('click', clickOutside, true);
  });

  document.addEventListener('click', clickOutside, true);

  export const showPopupMenu = (e: { clientX: number, clientY: number }) => {
    clientX = e.clientX;
    clientY = e.clientY;
    visible = true;
  };

  const withinBounds = (cur: number, max: number) => Math.max(0, Math.min(cur, max));

  $: overflowY = clientY + offsetHeight > window.innerHeight;
  $: maxHeight = window.innerHeight - offsetHeight;
  $: top = `${withinBounds(overflowY ? clientY - offsetHeight : clientY, maxHeight)}px`;

  $: overflowX = clientX + offsetWidth > window.innerWidth;
  $: maxWidth = window.innerWidth - offsetWidth;
  $: left = `${withinBounds(overflowX ? clientX - offsetWidth : clientX, maxWidth)}px`;

  function clickOutside({ target }: { target: any }) {
    if (!menu.contains(target)) {
      hide();
    }
  }

  function hide() {
    visible = false;
    dispatch('hide');
  }
</script>

<div class="container" aria-hidden="{!visible}" bind:this={menu} style:left style:top style:width
    bind:offsetWidth bind:offsetHeight on:click={hide}>
    {#if visible}
    <div class='popup-menu' in:fade={{ duration: 200 }} out:fade={{ duration: 200 }}>
      <slot></slot>
    </div>
    {/if}
</div>

<style lang="scss">
  div.container {
    position: fixed;
    z-index: 140;
    
    div.popup-menu {
      display: flex;
      flex-direction: column;
      border: 1px solid var(--color-bg-0);
      box-shadow: .1em .1em .4em #00000080;
      max-height: 90vh;
    }
  }
</style>