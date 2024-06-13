<script lang="ts">
	import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
    import Header from "./Header.svelte";
	import { auth, user } from "../stores/auth.store";

    async function login() {
        const credentials = await signInWithPopup(auth, new GoogleAuthProvider());
        console.log("User logged in: ", credentials.user.displayName);
    }
</script>

<!-- https://medium.com/@flavio.pinnelli/unlock-the-sveltekit-stores-potential-with-firebase-d120de3f07e4 -->
{#if $user}
    <slot user={$user} />
{:else}
    <Header>
        <button class="clear" on:click={login}>
            <i class="bx bx-lg bx-log-in"></i> <span>Login</span>
        </button>
    </Header>
{/if}

<style>
    button {
        cursor: pointer;
        margin: .4rem .8rem;
        padding: .4rem .8rem;
        border-radius: .5rem;
        border-width: 1px;
        background-color: var(--color-bg-2);
    }
</style>