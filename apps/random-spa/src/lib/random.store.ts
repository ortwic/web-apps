import { writable } from "svelte/store";
import shuffle from "@stdlib/random-shuffle";

type RandomIntegerGenerator = ReturnType<typeof randomIntegers>;

export const randomIntegers = (length: number, repeat = false) => {
    const random = (max: number) => Math.floor(Math.random() * max);
    let set: number[], index: number;

    function reset() {
        index = -1;
        set = repeat 
            ? Array.from({ length }, () => random(length))
            : shuffle(Array.from({ length }, (_, i) => i));
        if (import.meta.env.DEV) {        
            console.log('generated random set', set);
        }
    }

    reset();
    
    return {
        length,
        repeat,
        reset,
        prev: (): number | null => index > 0 ? set[--index] : null,
        next: (): number | null => index < length - 1 ? set[++index] : null
    };
};

export const randomIntegerStore = () => {
    const { subscribe, set } = writable<number | null>(null);
    const generators: RandomIntegerGenerator[] = [];
    const last = () => generators.at(-1);

    function create(length: number, repeat = false) {
        const gen = randomIntegers(length, repeat);
        generators.push(gen);
        set(gen.next());
    }

    function prev() {
        const n = last().prev();
        if (n === null && generators.length > 1) {
            generators.pop();
            prev();
        } else {
            set(n);
        }
    }

    function next() {
        const { length, repeat, next } = last();
        const n = next();
        if (n === null) {
            create(length, repeat);
        } else {
            set(n);
        }
    }
    
    return {
        subscribe,
        create,
        prev,
        next
    };
};