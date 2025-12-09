<script lang="ts">
    import { flip } from 'svelte/animate';
    import { params, push } from 'svelte-spa-router';
    import json from 'json5';
    import { Observable, switchMap } from 'rxjs';
    import Toolbar from '../ui/Toolbar.svelte';
    import PopupMenu from '../ui/PopupMenu.svelte';
    import { currentClientUser } from '../../stores/app.store';
    import type { ContentService } from '../../stores/db/content.service';
    import Breadcrumb from '../ui/Breadcrumb.svelte';
    import Section from './Section.svelte';

    $: disabled = !$currentClientUser;

    export let contentService$: Observable<ContentService>;
    export let path: string;
    export let rootPath = '/page';

    const document$ =  contentService$.pipe(switchMap(s => s.document));
    const content$ =  contentService$.pipe(switchMap(s => s.content));

    let currentIndex: number | undefined;
    let addSectionMenu: PopupMenu, editSectionMenu: PopupMenu;

    function showPopupMenu(event: MouseEvent, role: 'add' | 'edit', index?: number) {
        currentIndex = index;
        if (role === 'edit') {
            editSectionMenu.showPopupMenu(event);
        } else {
            addSectionMenu.showPopupMenu(event);
        }
    }
</script>

<header>
    <Toolbar showNav={true}>
        <slot name="commands"></slot>
        <span slot="title">
            <Breadcrumb {path} {rootPath} on:navigate={({ detail: path }) => push(`/${path}`)} />
        </span>
    </Toolbar>
</header>

<section class="content-64">
    {#if $document$ && $content$}
        <Section open={!$content$.length} value={$document$} title="Details of {$contentService$?.name}"
            property={{ dataType: 'map', properties: $contentService$.properties }} type="details"
            on:changed={({ detail }) => $contentService$.update($document$, detail)}>
            <span slot="commands">
                <button class="icon clear" disabled={disabled || !$contentService$.hasContentDefinition} title="Add section"
                    on:click={(ev) => showPopupMenu(ev, 'add', 0)}>
                    <i class="bx bx-plus"></i>
                </button>
            </span>
        </Section>
        
        {#each $content$ as { type, value, __id }, i (__id ?? json.stringify({ type, value }))}
        <div animate:flip={{ duration: 300 }}>
        {#if value !== null && $contentService$.types[type]}
        <Section {value} {type} property={$contentService$.types[type]} {disabled}
            on:changed={({ detail }) => $contentService$.section(i).update($document$, detail)}>
            <span slot="commands">
                <button class="icon clear" {disabled} title="Add section"
                    on:click={(ev) => showPopupMenu(ev, 'add', i)}>
                    <i class="bx bx-plus"></i>
                </button>
                <button class="icon clear" {disabled} title="Move up"
                    on:click={() => $contentService$.section(i).moveUp($document$)}>
                    <i class="bx bx-up-arrow"></i>
                </button>
                <button class="icon clear" {disabled} title="Move down"
                    on:click={() => $contentService$.section(i).moveDown($document$)}>
                    <i class="bx bx-down-arrow"></i>
                </button>
                <button class="icon clear" {disabled} title="Edit section"
                    on:click={(ev) => showPopupMenu(ev, 'edit', i)}>
                    <i class="bx bx-dots-vertical"></i> <!-- ⋮ -->
                </button>
            </span>
        </Section>
        {:else}
        <h2 class="input">Property definition for <span class="emphasis">'{type}'</span> not found!</h2>
        {/if}
        </div>
        {/each}

        <PopupMenu bind:this={editSectionMenu}>
            <div class="small popup-menu no-wrap y-flex">
                <button class="btn" {disabled} 
                    on:click={() => currentIndex !== undefined && $contentService$.section(currentIndex).remove($document$)}>
                    <span class="emphasis"><i class="bx bx-trash"></i> remove</span>
                </button>
            </div>
        </PopupMenu>

        <PopupMenu bind:this={addSectionMenu}>
            <div class="small popup-menu y-flex">
                <div class="center emphasis" style="margin:.4em .8em">&mdash; Add &mdash;</div>
                {#each Object.keys($contentService$.types) as type}
                    <button class="btn" {disabled} 
                        on:click={() => currentIndex !== undefined && $contentService$.section(currentIndex).insert(type, $document$)}>
                        <span class="emphasis"> {type}</span>
                    </button>
                {/each}
            </div>
        </PopupMenu>
    {:else}
        <h2 class="emphasis">Document '{$params?.wild}' not found</h2>
    {/if}
</section>

<style lang="scss">
</style>
