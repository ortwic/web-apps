/**
 * Tests for data-source.store.ts
 *
 * STRATEGY: Pure mocks, no Firebase emulator.
 *
 * Reason: The logic under test (routing, cursor management, hasMore state) lives
 * entirely in data-source.store.ts. DocumentStore is the boundary — we mock it
 * completely. This gives us full control over all Observable emissions and async
 * resolution without any network, timer, or emulator dependency.
 *
 * RxJS streams that never complete (like collectionData / countDocuments) are
 * the #1 source of flakiness. We use explicit Promise resolution for async paths
 * and firstValueFrom only on streams guaranteed to emit synchronously.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BehaviorSubject, firstValueFrom, Observable, of } from 'rxjs';
import type { DocumentStore } from '../stores/db/document.service';
import type { Entity } from '../models/schema.type';
import {
    createDocumentSource,
    type DocumentSource,
    type DocumentSourceOptions,
} from './data-source.store';

// ---------------------------------------------------------------------------
// Types & helpers
// ---------------------------------------------------------------------------

interface TestDoc extends Entity {
    id: string;
    name: string;
}

/** Minimal QueryDocumentSnapshot stub — only the identity matters for cursor logic. */
const makeCursor = (id: string) => ({ id } as any);

/** Build a fully-typed DocumentStore mock with controllable subjects. */
function createStoreMock(initialCount = 0) {
    const count$ = new BehaviorSubject<number>(initialCount);
    const docs$ = new BehaviorSubject<TestDoc[]>([]);

    const mock: DocumentStore<TestDoc> = {
        countDocuments: vi.fn(() => count$.asObservable()),
        getDocuments: vi.fn(() => docs$.asObservable()),
        getDocumentsAsync: vi.fn(),
        // The remaining DocumentStore members are not exercised by data-source.store.
        // They are stubs so TypeScript is satisfied.
        path: 'test/collection',
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
        getDocument: vi.fn(),
        setDocument: vi.fn(),
        setDocuments: vi.fn(),
        removeDocuments: vi.fn(),
    } as unknown as DocumentStore<TestDoc>;

    return { mock, count$, docs$ };
}

/** Default page result with no next cursor (last page). */
function makePageResult(docs: TestDoc[], hasNextPage = false) {
    const cursor = hasNextPage ? makeCursor(docs[docs.length - 1].id) : null;
    return { docs, nextCursor: cursor };
}

afterEach(() => vi.restoreAllMocks());

// ===========================================================================
// 1. createRealtimeSource
// ===========================================================================
//
// WHAT: When document count ≤ realtimeThreshold, createDocumentSource should
//       delegate to the realtime path (wraps getDocuments()).
//
// PROBLEM: getDocuments() returns a hot Observable that never completes.
//          We mock it with of(...) which emits synchronously and completes,
//          making firstValueFrom() safe to use without any real async wait.
//
// DIFFICULTY: Object.assign on an Observable is unusual — we must verify that
//             the result is still subscribable AND has the extra properties.
// ===========================================================================

describe('createRealtimeSource (count ≤ threshold)', () => {
    const OPTIONS: DocumentSourceOptions = { pageSize: 10, realtimeThreshold: 30 };

    it('should emit a DocumentSource that proxies getDocuments() emissions', async () => {
        // Arrange
        // We deliberately do NOT use marble testing here.
        // Reason: TestScheduler.assertDeepEqual does not handle Vitest asymmetric
        // matchers (expect.objectContaining) — the scheduler uses its own deep-equal.
        // A plain async test with firstValueFrom is safer and equally deterministic
        // because getDocuments() is mocked with of([]) which emits synchronously,
        // so firstValueFrom resolves immediately without any real async wait.
        const testDocs: TestDoc[] = [{ id: '1', name: 'Alpha' }];
        const { mock } = createStoreMock(5); // 5 <= 30 -> realtime
        vi.mocked(mock.getDocuments).mockReturnValue(of(testDocs));

        // Act
        const source$ = createDocumentSource(of(mock), OPTIONS);
        const source = await firstValueFrom(source$);

        // Assert: the DocumentSource is still a subscribable Observable
        const emitted = await firstValueFrom(source as unknown as Observable<TestDoc[]>);
        expect(emitted).toEqual(testDocs);
        // And it delegates to getDocuments, not getDocumentsAsync
        expect(mock.getDocuments).toHaveBeenCalledOnce();
        expect(mock.getDocumentsAsync).not.toHaveBeenCalled();
    });

    it('should expose isLoading as an Observable of false', async () => {
        // Arrange
        const testDocs: TestDoc[] = [{ id: '1', name: 'Alpha' }];
        const { mock } = createStoreMock(5);
        vi.mocked(mock.getDocuments).mockReturnValue(of(testDocs));
        const store$ = of(mock);

        // Act
        const source$ = createDocumentSource(store$, OPTIONS);
        const source = await firstValueFrom(source$);

        // Assert
        // isLoading on realtimeSource is of(false) — always resolves immediately.
        const isLoading = await firstValueFrom(source.isLoading);
        expect(isLoading).toBe(false);
    });

    it('should expose hasMore as an Observable of false', async () => {
        // Arrange
        const { mock } = createStoreMock(5);
        vi.mocked(mock.getDocuments).mockReturnValue(of([]));
        const store$ = of(mock);

        // Act
        const source = await firstValueFrom(createDocumentSource(store$, OPTIONS));

        // Assert
        // Realtime source has no pagination concept — hasMore is always false.
        const hasMore = await firstValueFrom(source.hasMore);
        expect(hasMore).toBe(false);
    });

    it('should resolve loadNextPage() immediately as a no-op', async () => {
        // Arrange
        const { mock } = createStoreMock(5);
        vi.mocked(mock.getDocuments).mockReturnValue(of([]));
        const store$ = of(mock);

        // Act
        const source = await firstValueFrom(createDocumentSource(store$, OPTIONS));

        // Assert: must resolve without throwing — no side effects expected
        await expect(source.loadNextPage()).resolves.toBeUndefined();
    });

    it('should not call getDocumentsAsync for realtime path', async () => {
        // Arrange
        const { mock } = createStoreMock(5);
        vi.mocked(mock.getDocuments).mockReturnValue(of([]));
        const store$ = of(mock);

        // Act
        await firstValueFrom(createDocumentSource(store$, OPTIONS));

        // Assert: pagination method must never be touched on realtime path
        expect(mock.getDocumentsAsync).not.toHaveBeenCalled();
    });
});

// ===========================================================================
// 2. createPaginatedSource — initial load
// ===========================================================================
//
// WHAT: When count > realtimeThreshold, the factory delegates to the paginated
//       path. The paginated source calls loadNextPage() immediately on creation.
//
// PROBLEM: loadNextPage() is async (calls getDocumentsAsync). The BehaviorSubject
//          inside paginatedSource emits synchronously, but the async fill happens
//          after the Promise resolves. We must await the Promise before asserting
//          state, otherwise we read the initial empty value.
//
// DIFFICULTY: createDocumentSource returns Observable<DocumentSource<T>>.
//             Getting the inner DocumentSource requires firstValueFrom on the outer
//             stream. Then asserting its BehaviorSubject state requires another
//             firstValueFrom — or direct subscription. We use firstValueFrom only
//             on Observables we know will complete or emit immediately.
// ===========================================================================

describe('createPaginatedSource (count > threshold)', () => {
    const OPTIONS: DocumentSourceOptions = { pageSize: 3, realtimeThreshold: 5 };

    async function buildPaginatedSource(
        initialDocs: TestDoc[],
        hasNextPage: boolean,
        count = 10,
    ) {
        const { mock, count$ } = createStoreMock(count); // count > threshold=5

        vi.mocked(mock.getDocumentsAsync).mockResolvedValue(
            makePageResult(initialDocs, hasNextPage),
        );

        const store$ = of(mock);
        const source$ = createDocumentSource(store$, OPTIONS);
        const source = await firstValueFrom(source$);

        // CRITICAL: the paginated source fires loadNextPage() in its constructor.
        // We must flush that microtask before asserting any state.
        // We do this by awaiting a resolved Promise — this yields to the microtask queue.
        await Promise.resolve();

        return { source, mock };
    }

    it('should call getDocumentsAsync once on creation with no cursor', async () => {
        // Arrange & Act
        const { mock } = await buildPaginatedSource(
            [{ id: '1', name: 'A' }],
            false,
        );

        // Assert: initial load uses no cursor and the configured pageSize
        expect(mock.getDocumentsAsync).toHaveBeenCalledOnce();
        expect(mock.getDocumentsAsync).toHaveBeenCalledWith(null, OPTIONS.pageSize);
    });

    it('should emit the loaded documents after initial page load', async () => {
        // Arrange
        const testDocs: TestDoc[] = [
            { id: '1', name: 'A' },
            { id: '2', name: 'B' },
        ];

        // Act
        const { source } = await buildPaginatedSource(testDocs, false);

        // Assert: BehaviorSubject emits synchronously → firstValueFrom is safe here
        const emitted = await firstValueFrom(source as unknown as any);
        expect(emitted).toEqual(testDocs);
    });

    it('should set hasMore to false when nextCursor is null', async () => {
        // Arrange & Act
        const { source } = await buildPaginatedSource(
            [{ id: '1', name: 'A' }],
            false, // no next cursor
        );

        // Assert
        const hasMore = await firstValueFrom(source.hasMore);
        expect(hasMore).toBe(false);
    });

    it('should set hasMore to true when nextCursor is returned', async () => {
        // Arrange & Act
        const { source } = await buildPaginatedSource(
            [{ id: '1', name: 'A' }, { id: '2', name: 'B' }, { id: '3', name: 'C' }],
            true, // cursor present → more pages
        );

        // Assert
        const hasMore = await firstValueFrom(source.hasMore);
        expect(hasMore).toBe(true);
    });

    it('should set isLoading to false after initial load completes', async () => {
        // Arrange & Act
        const { source } = await buildPaginatedSource(
            [{ id: '1', name: 'A' }],
            false,
        );

        // Assert: loading flag must be cleared in the finally block
        const isLoading = await firstValueFrom(source.isLoading);
        expect(isLoading).toBe(false);
    });

    it('should emit empty array and hasMore false when store returns no docs', async () => {
        // Arrange & Act
        const { source } = await buildPaginatedSource([], false);

        // Assert: no docs → nothing appended, hasMore false
        const emitted = await firstValueFrom(source as unknown as any);
        expect(emitted).toEqual([]);

        const hasMore = await firstValueFrom(source.hasMore);
        expect(hasMore).toBe(false);
    });
});

// ===========================================================================
// 3. loadNextPage — pagination accumulation
// ===========================================================================
//
// WHAT: Each call to loadNextPage() appends the next page to the existing docs
//       and advances the cursor. The cursor from page N becomes the startAfter
//       argument for page N+1.
//
// PROBLEM: loadNextPage() is guarded by isCurrentlyLoading — calling it while
//          a load is in progress is a no-op. Tests must await the in-flight
//          Promise before calling it again.
//
// DIFFICULTY: The internal isCurrentlyLoading flag is synced from
//             isLoading.subscribe(). Because subscribe is synchronous for
//             BehaviorSubject, the flag updates before the next await point.
//             Still — we must not call loadNextPage() concurrently in tests.
// ===========================================================================

describe('loadNextPage — pagination accumulation', () => {
    const OPTIONS: DocumentSourceOptions = { pageSize: 2, realtimeThreshold: 5 };

    it('should accumulate documents across multiple loadNextPage calls', async () => {
        // Arrange
        const page1: TestDoc[] = [{ id: '1', name: 'A' }, { id: '2', name: 'B' }];
        const page2: TestDoc[] = [{ id: '3', name: 'C' }, { id: '4', name: 'D' }];
        const cursor1 = makeCursor('2');

        const { mock } = createStoreMock(10);
        vi.mocked(mock.getDocumentsAsync)
            .mockResolvedValueOnce({ docs: page1, nextCursor: cursor1 }) // page 1
            .mockResolvedValueOnce({ docs: page2, nextCursor: null });   // page 2

        const source$ = createDocumentSource(of(mock), OPTIONS);
        const source = await firstValueFrom(source$);

        // Flush initial loadNextPage (page 1)
        await Promise.resolve();

        // Act: load page 2
        await source.loadNextPage();

        // Assert: both pages accumulated in order
        const allDocs = await firstValueFrom(source as unknown as any);
        expect(allDocs).toEqual([...page1, ...page2]);
    });

    it('should pass the cursor from page 1 as startAfter for page 2', async () => {
        // Arrange
        const cursor1 = makeCursor('doc-2');
        const { mock } = createStoreMock(10);
        vi.mocked(mock.getDocumentsAsync)
            .mockResolvedValueOnce({ docs: [{ id: '1', name: 'A' }, { id: '2', name: 'B' }], nextCursor: cursor1 })
            .mockResolvedValueOnce({ docs: [{ id: '3', name: 'C' }], nextCursor: null });

        const source = await firstValueFrom(createDocumentSource(of(mock), OPTIONS));
        await Promise.resolve(); // flush page 1

        // Act
        await source.loadNextPage(); // page 2

        // Assert: second call must receive the cursor from page 1
        expect(mock.getDocumentsAsync).toHaveBeenNthCalledWith(2, cursor1, OPTIONS.pageSize);
    });

    it('should not call getDocumentsAsync again when hasMore is false', async () => {
        // Arrange
        const { mock } = createStoreMock(10);
        vi.mocked(mock.getDocumentsAsync).mockResolvedValue({
            docs: [{ id: '1', name: 'A' }],
            nextCursor: null, // last page
        });

        const source = await firstValueFrom(createDocumentSource(of(mock), OPTIONS));
        await Promise.resolve(); // flush initial load

        // Act: attempt to load more — should be a no-op
        await source.loadNextPage();

        // Assert: only the initial call happened
        expect(mock.getDocumentsAsync).toHaveBeenCalledOnce();
    });

    it('should ignore concurrent loadNextPage calls while loading', async () => {
        // Arrange
        // We use a manually controlled Promise to keep isLoading=true long enough
        // to fire the second call while the first is still in flight.
        let resolveFirstLoad!: (v: any) => void;
        const firstLoadPromise = new Promise<any>((res) => { resolveFirstLoad = res; });

        const { mock } = createStoreMock(10);
        vi.mocked(mock.getDocumentsAsync)
            .mockReturnValueOnce(firstLoadPromise)
            .mockResolvedValueOnce({ docs: [], nextCursor: null });

        const source = await firstValueFrom(createDocumentSource(of(mock), OPTIONS));
        // Do NOT await here — initial load is in-flight

        // Act: fire a second call while first is still loading
        const secondCall = source.loadNextPage();

        // Now resolve the first load
        resolveFirstLoad({ docs: [{ id: '1', name: 'A' }], nextCursor: null });
        await firstLoadPromise;
        await secondCall;

        // Assert: only one call happened — concurrent call was ignored
        expect(mock.getDocumentsAsync).toHaveBeenCalledOnce();
    });
});

// ===========================================================================
// 4. createDocumentSource — routing logic
// ===========================================================================
//
// WHAT: The factory switches between realtime and paginated based on
//       countDocuments(). When count changes across the threshold, switchMap
//       should re-create the source.
//
// PROBLEM: distinctUntilChanged means the source is only recreated when count
//          actually crosses the threshold value change. We need to verify the
//          routing decision, not the internal Observable topology.
//
// DIFFICULTY: Testing switchMap re-subscription requires emitting multiple
//             values from countDocuments(). We use a BehaviorSubject here
//             because it lets us imperatively push values between assertions.
// ===========================================================================

describe('createDocumentSource — routing between realtime and paginated', () => {
    const OPTIONS: DocumentSourceOptions = { pageSize: 5, realtimeThreshold: 10 };

    it('should use realtime source when count equals threshold exactly', async () => {
        // Arrange: count = threshold → boundary condition → realtime
        const { mock } = createStoreMock(10); // exactly at threshold
        vi.mocked(mock.getDocuments).mockReturnValue(of([]));

        // Act
        const source = await firstValueFrom(createDocumentSource(of(mock), OPTIONS));

        // Assert: realtime path → getDocuments called, getDocumentsAsync never
        expect(mock.getDocuments).toHaveBeenCalled();
        expect(mock.getDocumentsAsync).not.toHaveBeenCalled();
    });

    it('should use paginated source when count is one above threshold', async () => {
        // Arrange: count = threshold + 1 → paginated
        const { mock } = createStoreMock(11);
        vi.mocked(mock.getDocumentsAsync).mockResolvedValue({ docs: [], nextCursor: null });

        // Act
        const source = await firstValueFrom(createDocumentSource(of(mock), OPTIONS));
        await Promise.resolve(); // flush initial loadNextPage

        // Assert: paginated path → getDocumentsAsync called, getDocuments never
        expect(mock.getDocumentsAsync).toHaveBeenCalled();
        expect(mock.getDocuments).not.toHaveBeenCalled();
    });

    it('should switch from realtime to paginated when count crosses threshold', async () => {
        // Arrange
        const count$ = new BehaviorSubject<number>(5); // starts below threshold
        const { mock } = createStoreMock(5);
        vi.mocked(mock.countDocuments).mockReturnValue(count$.asObservable());
        vi.mocked(mock.getDocuments).mockReturnValue(of([]));
        vi.mocked(mock.getDocumentsAsync).mockResolvedValue({ docs: [], nextCursor: null });

        const results: DocumentSource<TestDoc>[] = [];
        const sub = createDocumentSource(of(mock), OPTIONS).subscribe((s) => results.push(s));

        // Assert: first emission uses realtime (count=5 ≤ 10)
        await Promise.resolve();
        expect(mock.getDocuments).toHaveBeenCalledTimes(1);

        // Act: push count above threshold
        count$.next(15);
        await Promise.resolve();

        // Assert: second emission uses paginated (count=15 > 10)
        expect(mock.getDocumentsAsync).toHaveBeenCalled();

        sub.unsubscribe();
    });


    it('should re-create realtime source when count changes within threshold range', async () => {
        // Arrange
        // distinctUntilChanged compares raw count values (numbers), not the routing
        // decision. Count 3 -> 7 are different numbers, so switchMap fires again and
        // creates a new realtime source — getDocuments is called a second time.
        // This documents the actual behavior explicitly.
        const count$ = new BehaviorSubject<number>(3);
        const { mock } = createStoreMock(3);
        vi.mocked(mock.countDocuments).mockReturnValue(count$.asObservable());
        vi.mocked(mock.getDocuments).mockReturnValue(of([]));

        const sub = createDocumentSource(of(mock), OPTIONS).subscribe();

        // Act: push a different count value that still routes to realtime
        count$.next(7); // both 3 and 7 are <= threshold=10, but value changed -> re-creates
        await Promise.resolve();
        sub.unsubscribe();

        // Assert: getDocuments called twice — once per distinct count emission
        expect(mock.getDocuments).toHaveBeenCalledTimes(2);
        expect(mock.getDocumentsAsync).not.toHaveBeenCalled();
    });

    it('should not re-create source when count emits the same value twice', async () => {
        // Arrange
        // This is what distinctUntilChanged actually prevents: identical consecutive
        // values. Count 5 -> 5 is blocked -> no new switchMap -> getDocuments called once.
        const count$ = new BehaviorSubject<number>(5);
        const { mock } = createStoreMock(5);
        vi.mocked(mock.countDocuments).mockReturnValue(count$.asObservable());
        vi.mocked(mock.getDocuments).mockReturnValue(of([]));

        const sub = createDocumentSource(of(mock), OPTIONS).subscribe();

        // Act: emit the same value again
        count$.next(5);
        await Promise.resolve();
        sub.unsubscribe();

        // Assert: distinctUntilChanged blocked the duplicate -> only 1 source created
        expect(mock.getDocuments).toHaveBeenCalledTimes(1);
    });

});

// ===========================================================================
// 5. destroy()
// ===========================================================================
//
// WHAT: destroy() must complete all BehaviorSubjects in the paginated source
//       to prevent memory leaks.
//
// PROBLEM: Completed BehaviorSubjects throw if you try to emit after completion.
//          We verify completion by attempting a next() call and catching the error,
//          or by asserting the Subject.isStopped property — but that's internal.
//          Instead we subscribe and wait for the complete notification.
//
// DIFFICULTY: We cannot access the internal BehaviorSubjects directly.
//             We verify behavior via the public isLoading/hasMore Observables.
// ===========================================================================

describe('destroy()', () => {
    const OPTIONS: DocumentSourceOptions = { pageSize: 5, realtimeThreshold: 10 };

    it('should complete isLoading and hasMore observables on destroy', async () => {
        // Arrange
        const { mock } = createStoreMock(15); // paginated
        vi.mocked(mock.getDocumentsAsync).mockResolvedValue({ docs: [], nextCursor: null });

        const source = await firstValueFrom(createDocumentSource(of(mock), OPTIONS));
        await Promise.resolve();

        // Act & Assert: subscribe to isLoading — after destroy it must complete
        const isLoadingCompleted = new Promise<boolean>((resolve) => {
            source.isLoading.subscribe({ complete: () => resolve(true) });
        });
        const hasMoreCompleted = new Promise<boolean>((resolve) => {
            source.hasMore.subscribe({ complete: () => resolve(true) });
        });

        source.destroy();

        await expect(isLoadingCompleted).resolves.toBe(true);
        await expect(hasMoreCompleted).resolves.toBe(true);
    });

    it('should be safe to call destroy() on a realtime source', async () => {
        // Arrange: realtime source's destroy() is a no-op — must not throw
        const { mock } = createStoreMock(5);
        vi.mocked(mock.getDocuments).mockReturnValue(of([]));

        const source = await firstValueFrom(createDocumentSource(of(mock), OPTIONS));

        // Act & Assert: must not throw
        expect(() => source.destroy()).not.toThrow();
    });
});