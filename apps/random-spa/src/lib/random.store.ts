import { writable } from "svelte/store";

export const randomNumberStore = (repeat: () => boolean) => {
    const { subscribe, set } = writable(0);
    let record = [];
    function next(max: number) {
        const n = Math.floor(Math.random() * max);
        if (max && !repeat()) {
            if (record.length >= max) {
                record.length = 0;
            }
            if (record.indexOf(n) > -1) {
                return next(max);
            }
            record.push(n);
        }
        return n;            
    }
    return {
        subscribe,
        set: (max: number) => set(next(max))
    };
};