import { writable } from "svelte/store";

type NotificationType = 'info' | 'warn' | 'error';
type Message = {
    message: string,
    type: NotificationType
}

export const messageStack = (() => {
    const { subscribe, update } = writable<Message[]>([]);
    return {
        subscribe,
        push: (...messages: Message[]) => update((items) => [...messages, ...items]),
        pop: () => {
            let popped: Message | null = null;
            update((items) => {
                if (items.length > 0) {
                    popped = items[items.length - 1];
                    return items.slice(0, -1);
                } else {
                    return items;
                }
            });
            return popped ?? null;
        },
        exists: (value: Message) => {
            let result = false;
            subscribe((items) => result = items.some((item) => item.message === value.message));
            return result;
        }
    }
})();

function show(message: Message, timeoutSec = 2) {
    if (!messageStack.exists(message)) {
        messageStack.push(message);

        if (timeoutSec > 0) {
            setTimeout(() => messageStack.pop(), timeoutSec * 1000);
        }
    }
}

export function info(message: string, timeoutSec = 2) {
    show({ message, type: 'info' }, timeoutSec);
}

export function warn(message: string, timeoutSec = 2) {
    show({ message, type: 'warn' }, timeoutSec);
}

export function error(message: string, timeoutSec = 2) {
    show({ message, type: 'error' }, timeoutSec);
}