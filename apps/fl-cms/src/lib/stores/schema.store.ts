import { derived, type Readable } from "svelte/store";
import type { Collection } from "../models/schema.model";
import type { DocumentStore } from "./document.store";

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

    async getNodeFromDocumentPath(path: string): Promise<Collection | null> {
        const evenOnly = <T>(_: T, i: number) => i % 2 === 0;
        const schemaPath = path.split('/').filter(evenOnly);
        return this.getNode(...schemaPath);
    }

    async getNode(...pathSegments: string[]): Promise<Collection | null> {
        function lastNode(document: Collection | null, segments: string[]): Collection | null {
            const id = segments.shift();
            if (id && document?.subcollections) {
                const node = document.subcollections.find(c => c.id === id) ?? null;
                return segments.length ? lastNode(node, segments) : node;
            }
            return document;
        }

        const root = await this.store.getDocument(pathSegments.shift());
        return lastNode(root, pathSegments);
    }

    async createNodes(path: string): Promise<void> {
        function createTree(segments: string[], parentIds: string[]): Collection {
            const id = segments.shift()!;
            const subcollections = segments.length > 0 ? [createTree(segments, [...parentIds, id])] : [];
            return {
                id,
                name: id,
                path: [...parentIds, id].join('/'),
                properties: {},
                subcollections
            };
        }

        if (path) {
            const segments = path.toLowerCase().split('/').filter(Boolean);
            const document = createTree(segments, []);
            return this.store.setDocuments(document);
        }
    }

    async updateProperties(document: Collection): Promise<void> {
        const segments = document.pathSegments ? document.pathSegments.slice() : [];
        const updateSubcollection = (document: Collection, parent: Collection | undefined): Collection => {
            if (parent && parent.subcollections) {
                const id = segments.shift();
                const index = parent.subcollections.findIndex(c => c.id === id);
                if (index < 0) {
                    return updateSubcollection(document, parent);
                } 
                parent.subcollections[index].properties = document.properties;
                return parent;
            }
            if (!document.parent) {
                // firebase doesn't like undefined values
                delete document.parent;
            }
            return document;
        };
        const root = updateSubcollection(document, document.parent);
        return this.store.setDocuments(root);
    }

    async removeNodes(path: string): Promise<void> {
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
            const document = await this.getNode(segments.shift()!);
            if(document && removeSubcollection(document)) {
                return this.store.setDocuments(document);
            }
        } else if (segments.length) {
            return this.store.removeDocuments(segments[0]);
        }
    }
}