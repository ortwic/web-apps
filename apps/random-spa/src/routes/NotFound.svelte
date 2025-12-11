<script lang="ts">
    import { t } from 'svelte-i18n';
    import { fly } from 'svelte/transition';

    const no = Math.floor(Math.random() * $t('notfound.messages').length );
</script>

<section class="absolute" transition:fly={{ x: -500, duration: 500 }}>
    <h2>{ $t('notfound.title') }</h2>
    <p>
        { $t(`notfound.messages.${no}`) }
    </p>
    <p style="color: red">
        <slot></slot>
    </p>
</section>

<style>
    h2 {
        color: var(--primary);
    }

    section {
        margin: 1em;
    }
</style>