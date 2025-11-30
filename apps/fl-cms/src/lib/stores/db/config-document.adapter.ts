import { map, type Observable } from "rxjs";
import type { DocumentContract } from "../../contracts/document.contract";
import type { Content, SectionType } from "../../models/content.type";
import type { SchemaStore } from "./schema.service";
import type { AnyProperty, Properties } from "../../packages/firecms_core/types/properties.simple";

function propertyMapToContentArray(properties?: Properties<{}>): SectionType[] {
    const content = [] as SectionType[];
    return properties ? Object.entries(properties)
        .reduce((acc, [key, value]) => {
            const prop = value as AnyProperty;
            acc.push({ 
                type: prop.dataType, 
                value: {
                    ...prop,
                    __id: key
                } 
            });
            return acc;
        }, content) : content;
}

export class ConfigAdapter implements DocumentContract<Content> {
    constructor(private store: SchemaStore) {
    }
    
    getDocument(path?: string): Observable<Content | null> {
        return this.store.getCollectionFromSchemaPath(...path?.split('/') ?? [])
            .pipe(
                map(schema => ({
                    id: schema?.id,
                    name: schema?.name,
                    path: schema?.path,
                    content: propertyMapToContentArray(schema?.properties)
                } as Content))
            );
    }

    async setDocuments(...documents: Content[]): Promise<boolean> {
        throw new Error('Not implemented');
    }
}