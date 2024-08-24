import { writable } from "svelte/store";
import type { FlyParams } from "svelte/transition";

export function swipeTransitionStore(params: FlyParams) {
    const { subscribe, update } = writable(0);
    let dir = 1;

    function set(d: number): void {
        dir = d;
        update(i => ++i); // trigger animation by setting anything
    }

    function getParams(f: number): FlyParams {
        return {
            ...params,
            x: typeof params.x === "number" ? f * dir * params.x : params.x
        };
    }

    return {
        get in() { return getParams(1) },
        get out() { return getParams(-1) },
        right: () => set(1),
        left: () => set(-1),
        subscribe
    }
}
