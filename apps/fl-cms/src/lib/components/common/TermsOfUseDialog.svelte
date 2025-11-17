<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import Modal from "../ui/Modal.svelte";
  import Toolbar from "../ui/Toolbar.svelte";

  export let open = false;

  const dispatch = createEventDispatcher<{ accept: void }>();

  let agreed = false;

  function accept() {
    dispatch('accept');
    open = false;
  }
</script>


<Modal {open} on:close={() => open = false} closable={false} width="80%">
    <Toolbar>
        <span slot="title">Terms of Use</span>
    </Toolbar>
    <h3>🍪 This app only stores the data that is absolutely necessary for its operation. 🍪</h3>
    <p>
        This includes your Firestore configuration and layout settings, which are stored locally in your browser (local storage).<br/>
        <b>No tracking tools, cookies for advertising purposes, or external analytics services</b> are used.    
    </p>
    <div class="important">
        <ul>
            <li>
                <img src="icon.svg" alt="logo" style:width="16px"> Fl-CMS is provided “as is”, without any warranties of any kind.  <br/>
            </li>
            <li>
                Because the app works directly with your Firestore project, you are solely responsible for creating and maintaining 
                <span class="emphasis highlight">backups</span> of your data.     
            </li>
            <li>
                No liability is accepted for data loss, misconfigurations, or any other damages resulting from the use of this application. 
            </li>
            <li>
                Use of <img src="icon.svg" alt="logo" style:width="16px"> Fl-CMS implies acknowledgment of these limitations.
            </li>
        </ul>
    </div>
    <p>
        💾 By saving your first Firestore configuration, you'll be in the wonderland.
    </p>
    <p class="no-wrap">
        <input id="agreed" type="checkbox" bind:checked={agreed}> 
        <label for="agreed">I've read and understood the above. I'll accept 'em.</label>
    </p>
    <footer class="x-flex-full">
        <button disabled={!agreed} on:click={accept} class="w-100">
            Got it &nbsp; <i class="bx bx-check"></i>
        </button>
    </footer>
</Modal>

<style lang="scss">
    li {
        list-style: circle;
    }

    button {
        border-color: var(--color-bg-0);
    }
</style>