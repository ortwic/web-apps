import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { get } from "svelte/store";
import { collection, doc, setDoc, type Firestore } from "firebase/firestore";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { SchemaStore } from './schema.service';
import { setupTestEnvironment } from "../../../tests/firebase.setup";
import type { Properties } from '../../packages/firecms_core/types/properties.simple';
import { DocumentStore } from './document.service';
import type { Collection } from '../../models/schema.model';
import { schemeNestedSub, schemeRoot, schemeSub } from '../../../tests/seed.data';
import { firstValueFrom } from 'rxjs';

describe('schema store CRUD firebase tests', () => {
    let testEnv: RulesTestEnvironment | null;
    let store: DocumentStore<Collection>;
    let scheme: SchemaStore;

    beforeEach(async () => {
        testEnv = await setupTestEnvironment('fl-cms-test');
        if (testEnv) {
            const context = testEnv.unauthenticatedContext();
            const firestore = context.firestore() as unknown as Firestore;
    
            const schema = collection(firestore, '__schema');
            await setDoc(doc(schema, schemeRoot.id), schemeRoot);

            store = new DocumentStore<Collection>(firestore, '__schema');
        } 
        scheme = new SchemaStore(store);
    });

    afterEach(async () => {
        scheme?.unsubscribe();

        await testEnv?.clearFirestore();
        await testEnv?.cleanup()
    });

    it('should prevent timeouts by warming up firestore for very first test', async () => {
        const invalid = await firstValueFrom(scheme.getCollectionFromSchemaPath('invalid'));
        expect(invalid).toBeFalsy();
    });

    it('should get node from collection or subcollection', async () => {
        expect(await firstValueFrom(scheme.getCollectionFromSchemaPath('root'))).toEqual(schemeRoot);    
        expect(await firstValueFrom(scheme.getCollectionFromSchemaPath('root', 'sub1'))).toEqual(schemeSub);    
        expect(await firstValueFrom(scheme.getCollectionFromSchemaPath('root', 'sub1', 'sub11'))).toEqual(schemeNestedSub);    
    });

    it('should remove initial collection and subcollections', async () => {
        // act #1
        await scheme.removeCollections('root/sub1/sub11');
        let init = await firstValueFrom(scheme.getCollectionFromSchemaPath('root'));
        let sub1 = await firstValueFrom(scheme.getCollectionFromSchemaPath('root', 'sub1'));
        const sub11 = await firstValueFrom(scheme.getCollectionFromSchemaPath('root', 'sub1', 'sub11'));

        // assert #1
        expect(init?.id).equals('root');
        expect(sub1?.id).equals('sub1');
        expect(sub11).toBeFalsy();

        // act #2
        await scheme.removeCollections('root/sub1');
        init = await firstValueFrom(scheme.getCollectionFromSchemaPath('root'));
        sub1 = await firstValueFrom(scheme.getCollectionFromSchemaPath('root', 'sub1'));

        // assert #2
        expect(init?.id).equals('root');
        expect(sub1).toBeFalsy();
    });

    it('should create collections with subcollections', async () => {
        // act #1
        await scheme.createCollections('single');
        const single = await firstValueFrom(scheme.getCollectionFromSchemaPath('single'));

        // assert #1
        expect(single?.id).equals('single');

        // act #2
        await scheme.createCollections('foo/bar/baz');
        let foo = await firstValueFrom(scheme.getCollectionFromSchemaPath('foo'));
        let bar = await firstValueFrom(scheme.getCollectionFromSchemaPath('foo', 'bar'));
        let baz = await firstValueFrom(scheme.getCollectionFromSchemaPath('foo', 'bar', 'baz'));

        // assert #2
        expect(foo?.path).equals('foo');
        expect(bar?.path).equals('foo/bar');
        expect(baz?.path).equals('foo/bar/baz');

        // act #3
        foo = await firstValueFrom(scheme.getCollectionFromFullPath('foo'));
        bar = await firstValueFrom(scheme.getCollectionFromFullPath('foo/1/bar'));
        baz = await firstValueFrom(scheme.getCollectionFromFullPath('foo/2/bar/3/baz'));

        // assert #3
        expect(foo?.id).equals('foo');
        expect(bar?.id).equals('bar');
        expect(baz?.id).equals('baz');
    });

    it('should update properties without override', async () => {
        await scheme.createCollections('foo');
        const [fooExt] = get(scheme);
        
        // act
        await scheme.updateProperties({ ...fooExt!, properties: { foo: { dataType: 'number' } } });
        await scheme.createCollections('foo/bar/baz');

        // assert
        const foo = await firstValueFrom(scheme.getCollectionFromSchemaPath('foo'));
        expect(foo?.path).equals('foo', 'foo should not be removed');
        expect((<Properties>foo?.properties).foo?.dataType).equals('number');

        const bar = await firstValueFrom(scheme.getCollectionFromSchemaPath('foo', 'bar'));
        expect(bar?.path).equals('foo/bar');
        
        const baz = await firstValueFrom(scheme.getCollectionFromSchemaPath('foo', 'bar', 'baz'));
        expect(baz?.path).equals('foo/bar/baz');
    });

    it('should update properties on level 1 twice', async () => {
        await scheme.createCollections('foo/bar');
        const [fooExt] = get(scheme);

        // act #1
        await scheme.updateProperties({ ...fooExt!, properties: { foo: { dataType: 'number' } } });

        // assert #1
        let foo = await firstValueFrom(scheme.getCollectionFromSchemaPath('foo'));
        expect(foo?.id).equals('foo', 'foo should still exist');
        expect(foo?.subcollections?.find(c => c.id === 'bar')).toBeTruthy();
        expect((<Properties>foo?.properties).foo?.dataType).equals('number');

        // act #2
        await scheme.updateProperties({ ...foo!, properties: { bar: { dataType: 'date' } } });
        
        // assert #2
        foo = await firstValueFrom(scheme.getCollectionFromSchemaPath('foo'));
        expect(foo?.id).equals('foo', 'foo should still exist');
        expect(foo?.subcollections?.find(c => c.id === 'bar')).toBeTruthy();
        expect((<Properties>foo?.properties).foo?.dataType).equals('number');
        expect((<Properties>foo?.properties).bar?.dataType).equals('date');
    });

    it('should update properties on level 2 twice', async () => {
        await scheme.createCollections('foo/bar/baz');
        let [fooExt, barExt] = get(scheme);

        // act #1
        await scheme.updateProperties({ ...fooExt!, properties: { foo: { dataType: 'number' } } });
        await scheme.updateProperties({ ...barExt!, properties: { bar: { dataType: 'date' } } });
        
        // assert #1
        let foo = await firstValueFrom(scheme.getCollectionFromSchemaPath('foo'));
        let bar = await firstValueFrom(scheme.getCollectionFromSchemaPath('foo', 'bar'));
        expect(bar?.id).equals('bar', 'bar should still exist');
        expect(bar?.subcollections?.find(c => c.id === 'baz')).toBeTruthy();
        expect((<Properties>foo?.properties).foo?.dataType).equals('number');
        expect((<Properties>bar?.properties).bar?.dataType).equals('date');

        [fooExt, barExt] = get(scheme);

        // act #2
        await scheme.updateProperties({ ...fooExt!, properties: { baz: { dataType: 'string' } } });
        await scheme.updateProperties({ ...barExt!, properties: { baz: { dataType: 'string' } } });
        
        // assert #2
        foo = await firstValueFrom(scheme.getCollectionFromSchemaPath('foo'));
        bar = await firstValueFrom(scheme.getCollectionFromSchemaPath('foo', 'bar'));
        expect(bar?.id).equals('bar', 'bar should still exist');
        expect((<Properties>foo?.properties).foo?.dataType).equals('number');
        expect((<Properties>foo?.properties).baz?.dataType).equals('string');
        expect((<Properties>bar?.properties).bar?.dataType).equals('date');
        expect((<Properties>bar?.properties).baz?.dataType).equals('string');
    });

    it('should update nested properties on level 3', async () => {
        await scheme.createCollections('foo/bar/baz');
        const [fooExt, barExt, bazExt] = get(scheme);

        // act #1
        await scheme.updateProperties({ ...fooExt!, properties: { foo: { dataType: 'number' } } });

        // assert #2
        const foo = await firstValueFrom(scheme.getCollectionFromSchemaPath('foo'));
        expect(foo?.id).equals('foo', 'foo should still exist');
        expect(foo?.subcollections?.find(c => c.id === 'bar')).toBeTruthy();
        expect((<Properties>foo?.properties).foo?.dataType).equals('number');

        // act #2
        await scheme.updateProperties({ ...barExt!, properties: { bar: { dataType: 'date' } } });
        
        // assert #2
        const bar = await firstValueFrom(scheme.getCollectionFromSchemaPath('foo', 'bar'));
        expect(bar?.id).equals('bar', 'bar should still exist');
        expect(bar?.subcollections?.find(c => c.id === 'baz')).toBeTruthy();
        expect((<Properties>foo?.properties).foo?.dataType).equals('number');
        expect((<Properties>bar?.properties).bar?.dataType).equals('date');

        // act #3
        await scheme.updateProperties({ ...bazExt!, properties: { baz: { dataType: 'string' } } });
        
        // assert #3
        const docs = get(store);
        expect(docs.find(d => d.id === 'foo')).toBeTruthy();
        expect(docs.find(d => d.id === 'bar')).toBeFalsy();
        expect(docs.find(d => d.id === 'baz')).toBeFalsy();

        const baz = await firstValueFrom(scheme.getCollectionFromSchemaPath('foo', 'bar', 'baz'));
        expect(baz?.id).equals('baz', 'baz should still exist');
        expect((<Properties>foo?.properties).foo?.dataType).equals('number');
        expect((<Properties>bar?.properties).bar?.dataType).equals('date');
        expect((<Properties>baz?.properties).baz?.dataType).equals('string');
    });
});
