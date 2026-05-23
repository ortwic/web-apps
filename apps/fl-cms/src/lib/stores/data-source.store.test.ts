import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { firstValueFrom, skip, BehaviorSubject, filter } from 'rxjs';
import { addDoc, collection, deleteDoc, doc, setDoc, type Firestore } from 'firebase/firestore';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import type { Entity } from '../models/schema.type';
import { setupTestEnvironment } from '../../tests/firebase.setup';
import { createDocumentSource, type DocumentSource } from './data-source.store';
import { DocumentStore } from './db/document.service';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TestEntity extends Entity {
    id: string;
    name: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 3;
const REALTIME_THRESHOLD = PAGE_SIZE * 3; // 9
const OPTIONS = { pageSize: PAGE_SIZE, realtimeThreshold: REALTIME_THRESHOLD };

const COLLECTION_A = 'collection_a';
const COLLECTION_B = 'collection_b';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function seedCollection(
    firestore: Firestore,
    collectionPath: string,
    count: number
): Promise<void> {
    const ref = collection(firestore, collectionPath);
    const writes = Array.from({ length: count }, (_, index) =>
        setDoc(doc(ref, `doc-${index}`), { name: `Document ${index}` })
    );
    await Promise.all(writes);
}

function waitForEmitter(ms = 200): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Waits until the source emits an array of exactly `count` items. */
function waitForCount<T extends Entity>(source: DocumentSource<T>, count: number): Promise<T[]> {
    return firstValueFrom(source.pipe(filter((docs) => docs.length === count)));
}

async function resolveSource<T extends Entity>(
    documentStore$: BehaviorSubject<DocumentStore<T>>
): Promise<DocumentSource<T>> {
    return firstValueFrom(createDocumentSource(documentStore$.asObservable(), OPTIONS));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('createDocumentSource', () => {
    let testEnv: RulesTestEnvironment | null;
    let firestore: Firestore;

    beforeEach(async () => {
        testEnv = await setupTestEnvironment('fl-cms-test');
        const context = testEnv!.unauthenticatedContext();
        firestore = context.firestore() as unknown as Firestore;
    });

    afterEach(async () => {
        await testEnv?.clearFirestore();
        await testEnv?.cleanup();
    });

    // ─── Realtime path ────────────────────────────────────────────────────────

    describe('realtime path (count ≤ threshold)', () => {
        const ITEM_COUNT = REALTIME_THRESHOLD - 1; // 8

        beforeEach(async () => {
            await seedCollection(firestore, COLLECTION_A, ITEM_COUNT);
        });

        it('emits all documents from Firestore', async () => {
            const documentStore$ = new BehaviorSubject(new DocumentStore<TestEntity>(firestore, COLLECTION_A));
            const source = await resolveSource(documentStore$);

            const docs = await waitForCount(source, ITEM_COUNT);
            expect(docs).toHaveLength(ITEM_COUNT);
        });

        it('reflects a newly added document without loadNextPage', async () => {
            const documentStore$ = new BehaviorSubject(new DocumentStore<TestEntity>(firestore, COLLECTION_A));
            const source = await resolveSource(documentStore$);

            await waitForCount(source, ITEM_COUNT);

            const emissionAfterAdd = waitForCount(source, ITEM_COUNT + 1);
            await addDoc(collection(firestore, COLLECTION_A), { name: 'Newly added' });

            expect(await emissionAfterAdd).toHaveLength(ITEM_COUNT + 1);
        });

        it('reflects a deleted document without loadNextPage', async () => {
            const documentStore$ = new BehaviorSubject(new DocumentStore<TestEntity>(firestore, COLLECTION_A));
            const source = await resolveSource(documentStore$);

            await waitForCount(source, ITEM_COUNT);

            const emissionAfterDelete = waitForCount(source, ITEM_COUNT - 1);
            await deleteDoc(doc(firestore, COLLECTION_A, 'doc-0'));

            expect(await emissionAfterDelete).toHaveLength(ITEM_COUNT - 1);
        });

        it('isLoading is false', async () => {
            const documentStore$ = new BehaviorSubject(new DocumentStore<TestEntity>(firestore, COLLECTION_A));
            const source = await resolveSource(documentStore$);

            await waitForCount(source, ITEM_COUNT);
            expect(await firstValueFrom(source.isLoading)).toBe(false);
        });

        it('hasMore is false', async () => {
            const documentStore$ = new BehaviorSubject(new DocumentStore<TestEntity>(firestore, COLLECTION_A));
            const source = await resolveSource(documentStore$);

            await waitForCount(source, ITEM_COUNT);
            expect(await firstValueFrom(source.hasMore)).toBe(false);
        });
    });

    // ─── Paginated path ───────────────────────────────────────────────────────

    describe('paginated path (count > threshold)', () => {
        const ITEM_COUNT = REALTIME_THRESHOLD + 1; // 10

        beforeEach(async () => {
            await seedCollection(firestore, COLLECTION_A, ITEM_COUNT);
        });

        it('emits first page on creation', async () => {
            const documentStore$ = new BehaviorSubject(new DocumentStore<TestEntity>(firestore, COLLECTION_A));
            const source = await resolveSource(documentStore$);

            expect(await waitForCount(source, PAGE_SIZE)).toHaveLength(PAGE_SIZE);
        });

        it('accumulates documents across multiple loadNextPage calls', async () => {
            const documentStore$ = new BehaviorSubject(new DocumentStore<TestEntity>(firestore, COLLECTION_A));
            const source = await resolveSource(documentStore$);

            await waitForCount(source, PAGE_SIZE);

            await source.loadNextPage();
            await waitForCount(source, PAGE_SIZE * 2);
            expect(await firstValueFrom(source)).toHaveLength(PAGE_SIZE * 2);

            await source.loadNextPage();
            await waitForEmitter();
            expect((await firstValueFrom(source)).length).toBeGreaterThan(PAGE_SIZE * 2);
        });

        it('sets hasMore to false when all pages are loaded', async () => {
            const documentStore$ = new BehaviorSubject(new DocumentStore<TestEntity>(firestore, COLLECTION_A));
            const source = await resolveSource(documentStore$);

            await waitForCount(source, PAGE_SIZE);
            let hasMore = await firstValueFrom(source.hasMore);
            while (hasMore) {
                await source.loadNextPage();
                await waitForEmitter();
                hasMore = await firstValueFrom(source.hasMore);
            }

            expect(hasMore).toBe(false);
        });

        it('ignores a concurrent loadNextPage call while one is in flight', async () => {
            const documentStore$ = new BehaviorSubject(new DocumentStore<TestEntity>(firestore, COLLECTION_A));
            const source = await resolveSource(documentStore$);

            await waitForCount(source, PAGE_SIZE);
            await Promise.all([source.loadNextPage(), source.loadNextPage()]);
            await waitForEmitter();

            expect((await firstValueFrom(source)).length).toBeLessThanOrEqual(PAGE_SIZE * 2);
        });

        it.skip('totalCount reflects the actual Firestore collection size', async () => {
            const documentStore$ = new BehaviorSubject(new DocumentStore<TestEntity>(firestore, COLLECTION_A));
            const source = await resolveSource(documentStore$);

            // expect(await firstValueFrom(source.totalCount)).toBe(ITEM_COUNT);
        });
    });

    // ─── Collection switch ────────────────────────────────────────────────────

    describe('when documentStore$ switches to a new collection', () => {
        it('emits documents from the new collection', async () => {
            await seedCollection(firestore, COLLECTION_A, 2);
            await seedCollection(firestore, COLLECTION_B, 5);

            const documentStore$ = new BehaviorSubject<DocumentStore<TestEntity>>(
                new DocumentStore<TestEntity>(firestore, COLLECTION_A)
            );
            const source$ = createDocumentSource(documentStore$.asObservable(), OPTIONS);

            const sourceA = await firstValueFrom(source$);
            await waitForCount(sourceA, 2);

            const nextSource = firstValueFrom(source$.pipe(skip(1)));
            documentStore$.next(new DocumentStore<TestEntity>(firestore, COLLECTION_B));

            const sourceB = await nextSource;
            expect(await waitForCount(sourceB, 5)).toHaveLength(5);
        });

        it('does not carry over documents from the previous collection', async () => {
            await seedCollection(firestore, COLLECTION_A, 2);
            await seedCollection(firestore, COLLECTION_B, 3);

            const documentStore$ = new BehaviorSubject<DocumentStore<TestEntity>>(
                new DocumentStore<TestEntity>(firestore, COLLECTION_A)
            );
            const source$ = createDocumentSource(documentStore$.asObservable(), OPTIONS);

            const sourceA = await firstValueFrom(source$);
            await waitForCount(sourceA, 2);

            const nextSource = firstValueFrom(source$.pipe(skip(1)));
            documentStore$.next(new DocumentStore<TestEntity>(firestore, COLLECTION_B));

            const sourceB = await nextSource;
            expect(await waitForCount(sourceB, 3)).toHaveLength(3); // not 2 + 3
        });

        it('switches from paginated to realtime and stays reactive after switch', async () => {
            await seedCollection(firestore, COLLECTION_A, REALTIME_THRESHOLD + 1);
            await seedCollection(firestore, COLLECTION_B, 2);

            const documentStore$ = new BehaviorSubject<DocumentStore<TestEntity>>(
                new DocumentStore<TestEntity>(firestore, COLLECTION_A)
            );
            const source$ = createDocumentSource(documentStore$.asObservable(), OPTIONS);

            const sourceA = await firstValueFrom(source$);
            await waitForCount(sourceA, PAGE_SIZE);

            const nextSource = firstValueFrom(source$.pipe(skip(1)));
            documentStore$.next(new DocumentStore<TestEntity>(firestore, COLLECTION_B));

            const sourceB = await nextSource;
            await waitForCount(sourceB, 2);

            // Core regression: realtime reactivity must work on the new collection
            const realtimeEmission = waitForCount(sourceB, 3);
            await addDoc(collection(firestore, COLLECTION_B), { name: 'Live doc' });

            expect(await realtimeEmission).toHaveLength(3);
        });

        it.skip('updates totalCount after collection switch', async () => {
            await seedCollection(firestore, COLLECTION_A, 2);
            await seedCollection(firestore, COLLECTION_B, 7);

            const documentStore$ = new BehaviorSubject<DocumentStore<TestEntity>>(
                new DocumentStore<TestEntity>(firestore, COLLECTION_A)
            );
            const source$ = createDocumentSource(documentStore$.asObservable(), OPTIONS);

            const sourceA = await firstValueFrom(source$);
            await waitForCount(sourceA, 2);
            // expect(await firstValueFrom(sourceA.totalCount)).toBe(2);

            const nextSource = firstValueFrom(source$.pipe(skip(1)));
            documentStore$.next(new DocumentStore<TestEntity>(firestore, COLLECTION_B));

            const sourceB = await nextSource;
            await waitForCount(sourceB, 7);
            // expect(await firstValueFrom(sourceB.totalCount)).toBe(7);
        });
    });
});