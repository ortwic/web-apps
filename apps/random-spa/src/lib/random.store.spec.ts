import { describe, it, expect, beforeEach } from 'vitest';
import type { Readable } from 'svelte/store';
import { randomIntegers, randomIntegerStore } from './random.store';

describe('random number generator', () => {
    it('should have no repetitions', () => {
        const max = 100;
        const samples = [];
        const generator = randomIntegers(max, false);

        while(samples.length < max) {
            const n = generator.next();
            expect(n >= 0, `${n} lower than minimum.`).toBeTruthy();
            expect(n < max, `${n} greater than maximum.`).toBeTruthy();
            expect(samples.indexOf(n), `${n} already generated`).toBe(-1);

            samples.push(n);            
        }

        const sequential = samples.every((n, i) => i === 0 || n - samples[i - 1] > 1);
        expect(sequential, 'should not be sequential').toBeFalsy();
    });

    it('should have random numbers within range', () => {
        const max = 100;
        const samples = {};
        const generator = randomIntegers(max, true);
        let i = 0;

        while(i++ < max) {
            const n = generator.next();
            samples[n] = n;
            expect(n >= 0, `${n} lower than minimum.`).toBeTruthy();
            expect(n < max, `${n} greater than maximum.`).toBeTruthy();
        }

        expect(Object.keys(samples).length < max, 'expected duplicates').toBeTruthy();
    });

    it('should return null', () => {
        const generator = randomIntegers(2);
        const m = generator.prev();
        expect(m).toBeNull();
    });

    it('should change direction immediately', () => {
        const generator = randomIntegers(2);

        generator.next();
        const n = generator.next();
        const m = generator.prev();
        expect(n).not.toEqual(m);
    });
});

describe('random number store', () => {
    const $ = (store: Readable<number>) => {
        let n: number;
        store.subscribe(v => n = v);
        return n;
    };

    it('should not to be null', () => {
        const store = randomIntegerStore();
        store.create(2);

        expect($(store)).not.toBeNull();
    });

    it('should handle overflow on next', () => {
        const store = randomIntegerStore();
        store.create(1);

        store.next();
        expect($(store)).not.toBeNull();

        store.next();
        expect($(store)).not.toBeNull();
    });
});