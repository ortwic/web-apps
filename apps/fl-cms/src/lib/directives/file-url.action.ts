// in einem neuen lazy-load.action.ts
import { get } from 'svelte/store';
import { currentStorage } from '../stores/storage/storage.service';

export function fileUrl(img: HTMLImageElement, path: string) {
    const observer = new IntersectionObserver(async ([entry]) => {
        if (!entry.isIntersecting) { return; }
        img.src = await get(currentStorage).getFileUrl(path);
        observer.disconnect();
    });

    observer.observe(img);

    return {
        destroy() { observer.disconnect(); }
    };
}