import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { get } from "svelte/store";
import type { Firestore } from "firebase/firestore";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { SchemaStore } from './schema.store';
import { setupTestEnvironment } from "../../tests/firebase.setup";
import type { Properties } from '../packages/firecms_core/types/properties';

describe('schema store', () => {
    let testEnv: RulesTestEnvironment;
    let store: SchemaStore;

    beforeEach(async () => {
        testEnv = await setupTestEnvironment();
        const context = testEnv.unauthenticatedContext();
        const firestore = context.firestore() as unknown as Firestore;
        store = new SchemaStore(firestore);
    });

    afterEach(async () => {
        store.unsubscribe();
        await testEnv?.cleanup();
    });

    it('should create single collection', async () => {
        // act
        await store.createSchema('foo');
        const foo = await store.getNode('foo');

        // assert
        expect(foo?.path).equals('foo');
    });

    it('should create collection with subcollection', async () => {
        // act
        await store.createSchema('foo/bar');
        const [fooExt, barExt] = get(store);

        // assert
        expect(fooExt?.path).equals('foo');
        expect(barExt?.path).equals('foo/bar');

        // act
        const foo = await store.getNode('foo');
        const bar = await store.getNode('foo/bar');

        // assert
        expect(foo?.path).equals('foo');
        expect(bar?.path).equals('bar');
    });

    it('should create collection with nested subcollections', async () => {
        // act
        await store.createSchema('foo/bar/baz');
        const [fooExt, barExt, bazExt] = get(store);

        // assert
        expect(fooExt?.path).equals('foo');
        expect(barExt?.path).equals('foo/bar');
        expect(bazExt?.path).equals('foo/bar/baz');

        // act
        const foo = await store.getNode('foo');
        const bar = await store.getNode('foo/bar');
        const baz = await store.getNode('foo/bar/baz');

        // assert
        expect(foo?.path).equals('foo');
        expect(bar?.path).equals('bar');
        expect(baz?.path).equals('baz');
    });

    it('should update properties from schema and subcollection', async () => {
        {
            // arrange
            await store.createSchema('foo');
            const [fooExt] = get(store);
            
            // act #1
            await store.updateProperties({ ...fooExt, properties: { foo_prop: { dataType: 'number' } } });
            await store.createSchema('foo/bar/baz');
        }

        {
            // act #2
            const [fooExt, barExt] = get(store);
            await store.updateProperties({ ...barExt!, properties: { bar_prop: { dataType: 'date' } } });

            const foo = await store.getNode('foo');
            const bar = await store.getNode('foo/bar');

            // assert
            expect(foo?.path).equals('foo');
            expect(bar?.path).equals('bar');

            const fooProps = <Properties>foo?.properties;
            const barProps = <Properties>bar?.properties;
            expect(fooProps.foo_prop?.dataType).equals('number');
            expect(barProps.bar_prop?.dataType).equals('date');
        }
    });

    it('should remove single collection', async () => {
        // act
        await store.createSchema('foo');
        await store.removeNode('foo');
        const [foo] = get(store);

        // assert
        expect(foo).toBeUndefined();
    });

    it('should remove subcollection only', async () => {
        // act
        await store.createSchema('foo/bar');
        await store.removeNode('foo/bar');
        const [foo, bar] = get(store);

        // assert
        expect(foo?.path).equals('foo');
        expect(bar).toBeUndefined();
    });
});
