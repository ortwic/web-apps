import type { Firestore } from "firebase/firestore";
import { DocumentStore } from "./document.store";
import type { Collection } from "../models/schema.model";

export class SchemaStore extends DocumentStore<Collection> {
    constructor(firestore: Firestore | null) {
        super(firestore, '__schema');
    }

    protected override pipe(documents: Collection[]) {
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

        return documents.flatMap(c => extend(c));
    }

    async createSchema(pathSegments: string[]): Promise<void> {
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

        if (pathSegments.length > 0) {
            const document = createTree(pathSegments);
            return super.setDocuments(document);
        }
    }

    async updateSchema(document: Collection): Promise<void> {
        if (!document.parent) {
            return super.setDocuments(document);
        }
    }

    async removeSchema(pathSegments: string[]): Promise<void> {
        if (pathSegments.length > 1) {
            return this.removeFirstSubcollection(pathSegments);
        } else if (pathSegments.length) {
            return super.removeDocuments(pathSegments[0]);
        }
    }

    private async removeFirstSubcollection(pathSegments: string[]): Promise<void> {
        const document = await super.getDocument(pathSegments[0]);
        if (document?.subcollections) {
            const index = document.subcollections.findIndex(c => c.path === pathSegments[1]);
            document.subcollections.splice(index, 1);
            return super.setDocuments(document);                
        }
    }
}
