<script lang="ts">
    import type { User } from "firebase/auth";
    import { appStore } from "../../stores/app.store";

    export let user: User | null;

    function logout() {
        $appStore.signOut();
    }
</script>

<button disabled={!user} on:click={logout}>
    <i class="bx bx-log-out"></i>
    <span>Logout {user?.displayName}</span>
</button>