<script lang="ts">
    import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
    import { auth } from '../stores/auth.store';

    async function login() {
        const credentials = await signInWithPopup(auth, new GoogleAuthProvider());
        console.log('User logged in: ', credentials.user.displayName);
    }
</script>

<button on:click={login}>
    <i class="bx bx-lg bx-log-in"></i> <span>Login with Google</span>
</button>
