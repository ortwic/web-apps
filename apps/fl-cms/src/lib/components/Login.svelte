<script lang="ts">
    import { GoogleAuthProvider, signInWithPopup, type Auth } from 'firebase/auth';
    import { showInfo } from '../stores/notification.store';
    import { createEventDispatcher } from 'svelte';

    const dispatcher = createEventDispatcher();

    export let auth: Auth | null;

    async function login(auth: Auth | null) {
        if (auth) {    
            const credentials = await signInWithPopup(auth, new GoogleAuthProvider());
            showInfo(`User logged in as ${credentials.user.displayName}!`);
            dispatcher('login', credentials.user);
        }
    }
</script>

<button disabled={!auth} on:click={() => login(auth)}>
    <i class="bx bx-lg bx-log-in"></i> <span>Login with Google</span>
</button>
