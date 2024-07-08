import { readable, writable } from 'svelte/store';
import { Observable } from 'rxjs';
import type { MenuPages } from '../model/types';
import { showError } from './notification.store';

export const currentMenu = writable<MenuPages>('root');

export function observableToStore<T>(observable: Observable<T>) {
    return readable(null, set => {
        const subscription = observable.subscribe({
            next: value => set(value),
            error: error => showError(error),
            complete: () => console.debug('Observable completed')
        });

        return () => subscription.unsubscribe();
    });
}
