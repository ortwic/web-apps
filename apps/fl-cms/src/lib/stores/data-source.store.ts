import type { QueryDocumentSnapshot } from 'firebase/firestore';
import { BehaviorSubject, Observable, distinctUntilChanged, map, of, shareReplay, switchMap } from 'rxjs';
import type { DocumentStore } from '../stores/db/document.service';
import type { Entity } from '../models/schema.type';

const DEFAULT_PAGE_SIZE = 80;
const DEFAULT_REALTIME_THRESHOLD = DEFAULT_PAGE_SIZE * 3;

export interface DocumentSource<T> extends Observable<T[]> {
    readonly isLoading: Observable<boolean>;
    readonly hasMore: Observable<boolean>;
    loadNextPage(): Promise<void>;
    destroy(): void;
}

export interface DocumentSourceOptions {
    pageSize: number;
    realtimeThreshold: number;
}

function createRealtimeSource<T extends Entity>(
    service: DocumentStore<T>
): DocumentSource<T> {
    // Object.assign preserves the Observable prototype (pipe, subscribe, etc.)
    // while adding DocumentSource members directly on the instance.  
    const docs$ = service.getDocuments();
    return Object.assign(docs$, {
        isLoading: of(false),
        hasMore: of(false),
        loadNextPage: () => Promise.resolve(),
        destroy: () => {},
    });
}

function createPaginatedSource<T extends Entity>(
    service: DocumentStore<T>,
    pageSize: number
): DocumentSource<T> {
    const docs = new BehaviorSubject<T[]>([]);
    const isLoading = new BehaviorSubject(false);
    const hasMore = new BehaviorSubject(true);

    let currentCursor: QueryDocumentSnapshot<T> | null = null;
    let isCurrentlyLoading = false;
    let hasMorePages = true;

    isLoading.subscribe((value) => (isCurrentlyLoading = value));
    hasMore.subscribe((value) => (hasMorePages = value));

    async function loadNextPage(): Promise<void> {
        if (!isCurrentlyLoading && hasMorePages) {
            isLoading.next(true);
            try {
                const result = await service.getDocumentsAsync<T>(currentCursor, pageSize);
                currentCursor = result.nextCursor;
                hasMore.next(result.nextCursor !== null);

                if (result.docs.length > 0) {
                    docs.next([...docs.getValue(), ...result.docs]);
                }
            } finally {
                isLoading.next(false);
            }
        }
    }

    function destroy(): void {
        docs.complete();
        isLoading.complete();
        hasMore.complete();
    }

    loadNextPage();

    return Object.assign(docs, {
        isLoading,
        hasMore,
        loadNextPage,
        destroy,
    });
}

export function createDocumentSource<T extends Entity>(
    documentStore$: Observable<DocumentStore<T>>,
    options: DocumentSourceOptions = {
        pageSize: DEFAULT_PAGE_SIZE,
        realtimeThreshold: DEFAULT_REALTIME_THRESHOLD
    }
): Observable<DocumentSource<T>> {
    return documentStore$.pipe(
        switchMap((store) =>
            store.countDocuments().pipe(
                distinctUntilChanged(),
                map((count) => count > options.realtimeThreshold 
                    ? createPaginatedSource(store, options.pageSize)
                    : createRealtimeSource(store)
                )
            )
        ),
        shareReplay(1)
    );
}