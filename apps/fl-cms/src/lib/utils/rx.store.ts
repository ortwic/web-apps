import type { Readable } from "svelte/store";
import { Observable } from "rxjs";

export function fromStore<T>(store: Readable<T>): Observable<T> {
    return new Observable((observer) => store.subscribe(value => observer.next(value)));
}