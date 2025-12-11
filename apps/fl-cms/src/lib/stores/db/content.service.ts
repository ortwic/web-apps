import { map, type Observable } from "rxjs";
import type { AnyProperty, Properties } from "../../packages/firecms_core/types/properties.simple";
import type { DocumentContract } from "../../contracts/document.contract";
import type { Content, SectionType } from "../../models/content.type";
import type { Collection, UpdateArgs } from "../../models/schema.type";
import { arrayPropertyToMapProperty, defaultValueByType, mergeObject } from "../../utils/content.helper";
import { isUnique } from "../../utils/ui.helper";
import { showInfo } from "../notification.store";

type SaveOptions = { index?: number, merge?: boolean };
const contentKey: keyof Content = 'content';

export class ContentService {
    private contentTypes: Record<string, AnyProperty> | null = null;

    constructor(private store: DocumentContract<Content>, private schema: Collection | null, private id?: string) {
    }

    get name() {
        return this.schema?.name;
    }

    get properties(): Record<string, AnyProperty> {
        return Object.entries(this.schema?.properties as Properties ?? [])
            .filter(([field]) => field !== contentKey)
            .reduce((acc, [field, prop]) => {
                acc[field] = prop;
                return acc;
            }, {} as Record<string, AnyProperty>);
    }

    get document(): Observable<Content | null> {
        return this.store.getDocument(this.id);
    }

    get hasContentDefinition(): boolean {
        return Object.keys(this.types).length > 0;
    }

    get content(): Observable<SectionType[]> {
        return this.document.pipe(map(d => d && d[contentKey] || []));
    }

    get types(): Record<string, AnyProperty> {
        if (!this.contentTypes) {
            this.contentTypes = arrayPropertyToMapProperty((this.schema?.properties as Properties)[contentKey]);
        }
        return this.contentTypes;
    }

    update<T>(document: Content, { data, merge }: UpdateArgs<T>) {
        if (data && document) {
            Object.entries(data).forEach(([field, value]) => document[field] = value);
            this.saveChanges(document, { merge });
        }
    }

    section(index: number) {
        return {
            insert: (type: string, document: Content) => {
                const item: SectionType = {
                    type,
                    value: defaultValueByType(this.types[type]),
                    __id: Date.now()
                };
                if (!document[contentKey]) {
                    document[contentKey] = [];
                }

                if (index !== undefined && isUnique(document[contentKey], item)
                    && document[contentKey].insert(item, index)) {
                    this.saveChanges(document, { index });
                }
            },
            update: async <T>(document: Content, { data, merge }: UpdateArgs<T>) => {
                const section = document && document[contentKey][index];
                if (section && section.value !== data) {
                    section.value = merge ? mergeObject(section.value, data) : data;
                    await this.saveChanges(document, { index, merge });
                }
            },
            remove: (document: Content) => {
                if (index !== undefined && document[contentKey].remove(index)) {
                    this.saveChanges(document, { index });
                }
            },
            moveUp: (document: Content) => {
                if (document[contentKey].swap(index, index - 1)) {
                    this.saveChanges(document, { index });
                }
            },
            moveDown: (document: Content) => {
                if (document[contentKey].swap(index, index + 1)) {
                    this.saveChanges(document, { index });
                }
            }
        };
    }

    private async saveChanges(data: Content, { index, merge }: SaveOptions) {
        if (await this.store.setDocument(data, merge)) {
            if (index !== undefined) {
                const section = data && data[contentKey][index];
                showInfo(`Contents of section #${index} [${section.type}] ${merge ? 'merged' : 'updated'}.`);
            } else {
                showInfo(`Contents of ${this.name} ${merge ? 'merged' : 'updated'}.`);
            }
        }
    }
}