import { type Readable } from "svelte/store";
import { Observable } from "rxjs";

export function fromStore<T>(store: Readable<T>): Observable<T> {
    return new Observable((observer) => store.subscribe(value => observer.next(value)));
}

// export function toStore<T>(source: Observable<T> | Promise<T>): Readable<T> {
//   return readable<T>(undefined as T, (set) => {
//     if (source instanceof Observable) {
//       const sub = source.subscribe({
//         next: set,
//         error: console.error
//       });
//       return () => sub.unsubscribe();
//     }
//     source.then(set).catch(console.error);
//   });
// }