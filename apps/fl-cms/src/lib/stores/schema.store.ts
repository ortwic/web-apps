import { derived, type Readable } from "svelte/store";
import type { Firestore } from "firebase/firestore";
import type { Collection } from "../models/schema.model";
import { DocumentStore } from "./document.store";

export class SchemaStore implements Readable<Collection[]> {
    store: DocumentStore<Collection>;
    subscribe: Readable<Collection[]>['subscribe'];
    unsubscribe = () => {};

    constructor(firestore: Firestore | null) {
        this.store = new DocumentStore<Collection>(firestore, '__schema');
        this.subscribe = derived(this.store, this.pipe).subscribe;
        this.unsubscribe = this.store.unsubscribe;
    }

    private pipe(documents: Collection[]) {
        function extend(document: Collection, parent?: Collection): Collection[] {
            if (document.subcollections) {
                const pathSegments = parent?.path ? [parent.path, document.path] : [document.path];
                const path = pathSegments.join('/');
                const extended = { ...document, path, parent, pathSegments };
                const childs = document.subcollections.flatMap(c => extend(<Collection>c, extended));
                return [extended, ...childs];
            }
            return [document];
        }

        return documents
            .flatMap(c => extend(c))
            .toSorted((a, b) => a.path.localeCompare(b.path));
    }

    async getNode(path: string): Promise<Collection | null> {
        function lastNode(parent: Collection | null, segments: string[]): Collection | null {
            const path = segments.shift();
            if (path && parent?.subcollections) {
                const node = parent.subcollections.find(c => c.path === path) ?? null;
                return segments.length ? lastNode(node, segments) : node;
            }
            return parent;
        }

        const segments = path.split('/');
        return lastNode(await this.store.getDocument(segments.shift()), segments);
    }

    async createSchema(path: string): Promise<void> {
        function createTree(segments: string[]): Collection {
            const path = segments.shift()!;
            const subcollections = segments.length > 0 ? [createTree(segments)] : [];
            return {
                path,
                id: path,
                name: path,
                subcollections
            };
        }

        if (path) {
            const document = createTree(path.split('/'));
            return this.store.setDocuments(document);
        }
    }

    async updateProperties(document: Collection): Promise<void> {
        function updateSubcollection(document: Collection, parent: Collection | undefined): Collection {
            if (parent && parent.subcollections) {
                const path = document.pathSegments?.shift();
                const index = parent.subcollections.findIndex(c => c.path === path);
                if (index < 0) {
                    return updateSubcollection(document, parent);
                } 
                parent.subcollections[index].properties = document.properties;
                return parent;
            }
            return document;
        }

        const root = updateSubcollection(document, document.parent);
        return this.store.setDocuments(root);
    }

    async removeNode(path: string): Promise<void> {
        const segments = path.split('/');
        if (segments.length > 2) {
            throw new Error('Removing nested subcollections was not implemented');
        } else if (segments.length > 1) {
            return this.removeFirstSubcollection(segments);
        } else if (segments.length) {
            return this.store.removeDocuments(segments[0]);
        }
    }

    private async removeFirstSubcollection(pathSegments: string[]): Promise<void> {
        const document = await this.store.getDocument(pathSegments[0]);
        if (document?.subcollections) {
            const index = document.subcollections.findIndex(c => c.path === pathSegments[1]);
            document.subcollections.splice(index, 1);
            return this.store.setDocuments(document);                
        }
    }
}