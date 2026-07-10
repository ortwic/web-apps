import type { QueryDocumentSnapshot } from 'firebase/firestore';
import { BehaviorSubject, Observable, distinctUntilChanged, map, of, shareReplay, switchMap } from 'rxjs';
import type { DocumentStore } from '../stores/db/document.service';
import type { Entity } from '../models/schema.type';
import type { DocumentSource, DocumentSourceOptions } from './data-source.types';
import { showError, showInfo } from './notification.store';

export function createDocumentSource<T extends Entity>(
    documentStore$: Observable<DocumentStore<T>>,
    options: DocumentSourceOptions<T>
): Observable<DocumentSource<T>> {
    const { idField, pageSize, realtimeThreshold } = options;

    function createRealtimeSource(service: DocumentStore<T>): DocumentSource<T> {
        // Object.assign preserves the Observable prototype (pipe, subscribe, etc.)
        // while adding DocumentSource members directly on the instance.
        const docs$ = service.getDocuments();
        return Object.assign(docs$, {
            isLoading: of(false),
            hasMore: of(false),
            loadNextPage: () => Promise.resolve(),
            updateEntries: createUpdateEntries(service),
            destroy: () => {},
        });
    }

    function createPaginatedSource(service: DocumentStore<T>): DocumentSource<T> {
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

        function patchLocal(ids: string[], field: keyof T, value: unknown) {
            const idSet = new Set(ids);
            docs.next(docs.getValue().map(doc =>
                idSet.has(doc[idField] as string) ? { ...doc, [field]: value } : doc
            ));
            return Promise.resolve();
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
            updateEntries: createUpdateEntries(service, patchLocal),
            destroy,
        });
    }

    function createUpdateEntries(service: DocumentStore<T>, onPatched?: DocumentSource<T>['updateEntries']) {
        return async function updateEntries(ids: string[], field: keyof T & string, value: unknown): Promise<void> {
            if (ids.length) {
                if (options.bulkEditUpdateSameValuesOnly) {
                    showError('TODO consider different values is not implemented ');
                    return;
                }

                try {
                    const changes = ids.map(id => ({ [idField]: id, [field]: value } as T));
                    if (await service.setDocuments(...changes)) {
                        showInfo(`Updated ${ids.length} document(s). {${field}: ${value}}`);
                        onPatched?.(ids, field, value);
                    } else {
                        showError(`Unable to update ${ids.length} document(s). {${field}: ${value}}`);
                    }
                } catch (error: any) {
                    showError(`Failed to update document(s): ${error?.message}`);
                }
            }
        };
    }

    return documentStore$.pipe(
        switchMap((store) =>
            store.countDocuments().pipe(
                distinctUntilChanged(),
                map((count) => count > realtimeThreshold
                    ? createPaginatedSource(store)
                    : createRealtimeSource(store)
                )
            )
        ),
        shareReplay(1)
    );
}