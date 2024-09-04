<script lang="ts">
    import type { Auth, User } from "firebase/auth";
    import { signOut } from "firebase/auth";

    export let auth: Auth | null;
    export let user: User | null;

    function logout() {
        if (auth) {
            signOut(auth);
        }
    }
</script>

<button disabled={!user} on:click={logout}>
    <i class="bx bx-log-out"></i>
    <span>Logout {user?.displayName}</span>
</button>