<script lang="ts">
    import { getAuth, signOut } from 'firebase/auth';
    import Login from '$lib/components/Login.svelte';
    import AuthCheck from '$lib/components/AuthCheck.svelte';

    export function logout() {
        const auth = getAuth();
        signOut(auth);
    }
</script>

<svelte:head>
    <title>Profile</title>
    <meta name="description" content="Profile settings of this app" />
</svelte:head>

<div class="text-column">
    <AuthCheck let:user>
        <div slot="login">
            <Login />
        </div>
        <h1>
            <img width="32" src={user?.photoURL} alt={user?.email} />
            {user?.displayName}
        </h1>
        <button on:click={logout}>
            <i class="bx bx-log-out"></i>
            <span>Logout</span>
        </button>
    </AuthCheck>
</div>
