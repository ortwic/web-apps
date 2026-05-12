import { writable, readonly, type Readable } from 'svelte/store';

export interface PageResult<T, TCursor> {
    docs: T[];
    nextCursor: TCursor | null;
}

export type FetchPage<T, TCursor> = (
    cursor: TCursor | null
) => Promise<PageResult<T, TCursor>>;

export interface DataSourceStore<T> extends Readable<T[]> {
    readonly isLoading: Readable<boolean>;
    readonly hasMore: Readable<boolean>;
    loadNextPage(): Promise<void>;
    reset(): void;
}

export function createDataSource<T, TCursor = unknown>(
    fetchPage: FetchPage<T, TCursor>
): DataSourceStore<T> {
    const docs = writable<T[]>([]);
    const isLoading = writable<boolean>(false);
    const hasMore = writable<boolean>(true);

    let currentCursor: TCursor | null = null;
    let currentIsLoading = false;
    let currentHasMore = true;

    isLoading.subscribe(v => currentIsLoading = v);
    hasMore.subscribe(v => currentHasMore = v);

    async function loadNextPage(): Promise<void> {
        if (!currentIsLoading && currentHasMore) {
            isLoading.set(true);

            try {
                const result = await fetchPage(currentCursor);
                currentCursor = result.nextCursor;
                hasMore.set(result.nextCursor !== null);
                
                if (result.docs.length > 0) {
                    docs.update(acc => [...acc, ...result.docs]);
                }
            } finally {
                isLoading.set(false);
            }
        }

    }

    function reset(): void {
        currentCursor = null;
        hasMore.set(true);
        docs.set([]);
        loadNextPage();
    }

    loadNextPage();

    return {
        subscribe: docs.subscribe,
        isLoading: readonly(isLoading),
        hasMore: readonly(hasMore),
        loadNextPage,
        reset,
    };
}