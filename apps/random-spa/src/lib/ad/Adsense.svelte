<script lang="ts">
    import { onMount } from 'svelte';
  
    export let adSlot;
    export let adClient: string;
    let adElement: HTMLElement;
  
    onMount(() => {
        const adsbygoogle = (window as any).adsbygoogle || [];
        
        try {
            if (!adElement.getAttribute('data-ad-status')) {
                adsbygoogle.push({});
            } else {
                console.log(`Ad already loaded or not found for slot: ${adSlot}`);
            }
        } catch (error) {
            console.warn('Error loading ad:', error);
        }
    });
</script>
  
<ins bind:this={adElement}
    data-ad-client={adClient}
    data-ad-slot={adSlot}
    data-ad-format="auto"
    data-full-width-responsive="true"></ins>
  
<svelte:head>
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client={adClient}"
        crossorigin="anonymous"></script>
</svelte:head>
  
<style>
:host{
    background-color: #80808080;
}

ins {
    display: block;
}
</style>