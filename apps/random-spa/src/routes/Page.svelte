<script lang="ts">
    import { t } from 'svelte-i18n';
    import { fly } from 'svelte/transition';
    import { marked } from "marked";
    import { lang } from "../lib/i18n";
    import type { GameContent } from "../lib/models";
    import { buildStore } from "../lib/firebase/firestore.builder";


    export let params: { 
        path?: string
    } = {};

    const store = buildStore<GameContent>('pages');
    $: document = store.getDocument(params.path);

    function content(e: GameContent) {
        const result = e && e.content_de && lang === 'de' ? e.content_de : e?.content;
        return result ? marked(result, { mangle: false, headerIds: false }) : 'Not Found';
    }
</script>

{#await document}
    <section class="absolute" transition:fly={{ x: -500, duration: 500 }}>
        { $t('start.loading') }
    </section>
{:then page} 
    <section class="absolute" transition:fly={{ x: -500, duration: 500 }}>
        {@html content(page)}
    </section>
{/await}