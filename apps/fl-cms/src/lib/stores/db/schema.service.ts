import { derived, type Readable } from "svelte/store";
import type { Collection } from "../../models/schema.model";
import type { DocumentStore } from "./document.service";
import { firstValueFrom, map, of, Observable } from "rxjs";

export class SchemaStore implements Readable<Collection[]> {
    subscribe: Readable<Collection[]>['subscribe'];
    unsubscribe = () => {};

    constructor(private store: DocumentStore<Collection>) {
        this.subscribe = derived(this.store, this.flatNestedCollections).subscribe;
        this.unsubscribe = this.store.unsubscribe;
    }

    private flatNestedCollections(documents: Collection[]) {
        function extend(document: Collection, parent?: Collection): Collection[] {
            if (document.subcollections) {
                const pathSegments = Object.freeze(parent?.pathSegments 
                    ? [...parent.pathSegments, document.id] 
                    : [document.id]);
                const path = pathSegments.join('/');
                const extended: Collection = { ...document, path, parent, pathSegments };
                const childs = document.subcollections.flatMap(c => extend(c, extended));
                return [extended, ...childs];
            }
            return [document];
        }

        const model = documents
            .flatMap(c => extend(c))
            .toSorted((a, b) => a.path.localeCompare(b.path));
        return model;
    }

    async getCollectionAsync(path?: string): Promise<Collection | null> {
        return await firstValueFrom(this.getCollectionFromFullPath(path));
    }

    /**
     * get collection by full path
     * @param path the full path including documentIds
     * @returns the collection or corelated subcollection
     */
    getCollectionFromFullPath(path?: string): Observable<Collection | null> {
        if (path) {
            const evenOnly = <T>(_: T, i: number) => i % 2 === 0;
            const schemaPath = path.split('/').filter(evenOnly);
            return this.getCollectionFromSchemaPath(...schemaPath);
        }
        return of(null);
    }

    /**
     * get collection by schema path
     * @param path the schema path without documentIds
     * @returns the collection or corelated subcollection
     */
    getCollectionFromSchemaPath(...schemaPathSegments: string[]): Observable<Collection | null> {
        function lastNode(document: Collection | null, segments: string[]): Collection | null {
            const id = segments.shift();
            if (id && document?.subcollections) {
                const node = document.subcollections.find(c => c.id === id) ?? null;
                return segments.length ? lastNode(node, segments) : node;
            }
            return document;
        }

        return this.store.getDocument(schemaPathSegments.shift())
            // pass copy of array, otherwise oberservable would fire multiple times
            .pipe(map(d => lastNode(d, [...schemaPathSegments])));
    }

    async createCollections(path: string): Promise<void> {
        function createTree(segments: string[], parentIds: string[]): Collection {
            const id = segments.shift()!;
            const subcollections = segments.length > 0 ? [createTree(segments, [...parentIds, id])] : [];
            return {
                id,
                name: id,
                path: [...parentIds, id].join('/'),
                subcollections
            };
        }

        if (path) {
            const segments = path.toLowerCase().split('/').filter(Boolean);
            const document = createTree(segments, []);
            return this.store.setDocuments(document);
        }
    }

    async updateProperties(target: Collection): Promise<void> {
        if (!target.path?.trim()) {
            throw new Error('document has no path');
        }

        const setProperties = (node: Collection | undefined): void => {
            if (node) {
                const id = segments.shift();
                if (target.id === id) {
                    if ('merge' in this.store.options && this.store.options.merge) {
                        node.properties = { ...node.properties, ...target.properties };
                    } else {
                        node.properties = target.properties;
                    }
                } else if (node.subcollections) {
                    const sub = node.subcollections.find(c => c.id === segments[0]);
                    setProperties(sub);
                }
                if (!node.parent) {
                    // firebase doesn't like undefined values
                    delete node.parent;
                }
            }
        };

        const segments = target.path.split('/');
        const root = await firstValueFrom(this.getCollectionFromSchemaPath(segments[0]));
        if (root) {
            setProperties(root);
            await this.store.setDocuments(root);
        }
    }

    async removeCollections(path: string): Promise<void> {
        const segments = path.split('/');
        const removeSubcollection = (document: Collection): boolean => {
            if (document.subcollections) {
                const id = segments.shift();
                const index = document.subcollections.findIndex(c => c.id === id);
                if (index > -1) {
                    if (segments.length) {
                        return removeSubcollection(document.subcollections[index]);
                    } 
                    document.subcollections.splice(index, 1);
                    return true;                    
                }
            }
            return false;
        };

        if (segments.length > 1) {
            const root = await firstValueFrom(this.getCollectionFromSchemaPath(segments.shift()!));
            if(root && removeSubcollection(root)) {
                return this.store.setDocuments(root);
            }
        } else if (segments.length) {
            return this.store.removeDocuments(segments[0]);
        }
    }
}