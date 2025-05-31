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
                const pathSegments = parent?.pathSegments 
                    ? [...parent.pathSegments, document.path] 
                    : [document.path];
                const path = pathSegments.join('/');
                const extended = { ...document, path, parent, pathSegments };
                const childs = document.subcollections.flatMap(c => extend(<Collection>c, extended));
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
        function lastNode(parent: Collection | null, segments: string[]): Collection | null {
            const path = segments.shift();
            if (path && parent?.subcollections) {
                const node = parent.subcollections.find(c => c.path === path) ?? null;
                return segments.length ? lastNode(node, segments) : node;
            }
            return parent;
        }

        const root = await this.store.getDocument(pathSegments.shift());
        return lastNode(root, pathSegments);
    }

    async createNodes(path: string): Promise<void> {
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
            const document = createTree(path.split('/').filter(Boolean));
            return this.store.setDocuments(document);
        }
    }

    async updateProperties(document: Collection): Promise<void> {
        const updateSubcollection = (document: Collection, parent: Collection | undefined): Collection => {
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
        };

        const root = updateSubcollection(document, document.parent);
        delete root.parent;
        return this.store.setDocuments(root);
    }

    async removeNodes(path: string): Promise<void> {
        const segments = path.split('/');
        const removeSubcollection = (document: Collection): boolean => {
            if (document.subcollections) {
                const path = segments.shift();
                const index = document.subcollections.findIndex(c => c.path === path);
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