import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { get } from "svelte/store";
import { collection, doc, setDoc, type Firestore } from "firebase/firestore";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { SchemaStore } from './schema.store';
import { setupTestEnvironment } from "../../tests/firebase.setup";
import type { Properties } from '../packages/firecms_core/types/properties';
import { DocumentStore } from './document.store';
import type { Collection } from '../models/schema.model';

const initialNestedSub: Collection = {
    id: 'sub11',
    path: 'sub11',
    name: 'Nested Sub',
    properties: {
        prop111: {
            name: 'Prop 1.1.1',
            dataType: 'string'
        }
    }
};
const initialSub: Collection = {
    id: 'sub1',
    path: 'sub1',
    name: 'Sub',
    properties: {
        prop11: {
            name: 'Prop 1.1',
            dataType: 'string'
        }
    },
    subcollections: [initialNestedSub]
};
const initialRoot: Collection = {
    id: 'root',
    path: 'root',
    name: 'Root',
    properties: {
        prop1: {
            name: 'Prop 1',
            dataType: 'string'
        }
    },
    subcollections: [initialSub]
};

describe('schema store CRUD integration tests (requires firebase emulators)', () => {
    let testEnv: RulesTestEnvironment;
    let store: SchemaStore;

    beforeEach(async () => {
        testEnv = await setupTestEnvironment();
        const context = testEnv.unauthenticatedContext();
        const firestore = context.firestore() as unknown as Firestore;

        await seedFirestore(firestore);
        const ds = new DocumentStore<Collection>(firestore, '__schema');
        store = new SchemaStore(ds);
    });
    
    async function seedFirestore(firestore: Firestore) {
        const schema = collection(firestore, '__schema');
        await setDoc(doc(schema, initialRoot.id), initialRoot);
    }

    afterEach(async () => {
        store.unsubscribe();

        // TODO data from previous tests should be removed
        await testEnv?.cleanup();
    });

    it('should prevent timeouts by warming up firestore for very first test', async () => {
        const invalid = await store.getNode('invalid');
        expect(invalid).toBeFalsy();
    });

    it('should get node from collection or subcollection', async () => {
        expect(await store.getNode('root')).toEqual(initialRoot);    
        expect(await store.getNode('root', 'sub1')).toEqual(initialSub);    
        expect(await store.getNode('root', 'sub1', 'sub11')).toEqual(initialNestedSub);    
    });

    it('should remove initial collection and subcollections', async () => {
        // act #1
        await store.removeNodes('root/sub1/sub11');
        let init = await store.getNode('root');
        let sub1 = await store.getNode('root', 'sub1');
        const sub11 = await store.getNode('root', 'sub1', 'sub11');

        // assert #1
        expect(init?.path).equals('root');
        expect(sub1?.path).equals('sub1');
        expect(sub11).toBeFalsy();

        // act #2
        await store.removeNodes('root/sub1');
        init = await store.getNode('root');
        sub1 = await store.getNode('root', 'sub1');

        // assert #2
        expect(init?.path).equals('root');
        expect(sub1).toBeFalsy();
    });

    it('should create collections with subcollections', async () => {
        // act #1
        await store.createNodes('single');
        const single = await store.getNode('single');

        // assert #1
        expect(single?.path).equals('single');

        // act #2
        await store.createNodes('foo/bar/baz');
        const [fooExt, barExt, bazExt] = get(store);

        // assert #2
        expect(fooExt?.path).equals('foo');
        expect(barExt?.path).equals('foo/bar');
        expect(bazExt?.path).equals('foo/bar/baz');

        // act #3
        const foo = await store.getNodeFromDocumentPath('foo');
        const bar = await store.getNodeFromDocumentPath('foo/1/bar');
        const baz = await store.getNodeFromDocumentPath('foo/2/bar/3/baz');

        // assert #3
        expect(foo?.path).equals('foo');
        expect(bar?.path).equals('bar');
        expect(baz?.path).equals('baz');
    });

    it('should update properties from schema and subcollection', async () => {
        {
            // arrange
            await store.createNodes('foo');
            const [fooExt] = get(store);
            
            // act #1
            await store.updateProperties({ ...fooExt, properties: { foo_prop: { dataType: 'number' } } });
            await store.createNodes('foo/bar/baz');
        }

        {
            // act #2
            const [fooExt, barExt] = get(store);
            await store.updateProperties({ ...barExt!, properties: { bar_prop: { dataType: 'date' } } });

            const foo = await store.getNode('foo');
            const bar = await store.getNode('foo', 'bar');

            // assert
            expect(foo?.path).equals('foo');
            expect(bar?.path).equals('bar');

            const fooProps = <Properties>foo?.properties;
            const barProps = <Properties>bar?.properties;
            expect(fooProps.foo_prop?.dataType).equals('number');
            expect(barProps.bar_prop?.dataType).equals('date');
        }
    });

    it('should create and remove collection with subcollections', async () => {
        // act #1
        await store.createNodes('single');
        await store.removeNodes('single');
        const single = await store.getNode('single');

        // assert #1
        expect(single).toBeFalsy();
        
        // act #2
        await store.createNodes('foo/bar/baz');
        await store.removeNodes('foo/bar/baz');
        let foo = await store.getNode('foo');
        let bar = await store.getNode('foo', 'bar');
        const baz = await store.getNode('foo', 'bar', 'baz');

        // assert #2
        expect(foo?.path).equals('foo');
        expect(bar?.path).equals('bar');
        expect(baz).toBeFalsy();

        // act #3
        await store.removeNodes('foo/bar');
        foo = await store.getNode('foo');
        bar = await store.getNode('foo', 'bar');

        // assert #3
        expect(foo?.path).equals('foo');
        expect(bar).toBeFalsy();
    });
});
