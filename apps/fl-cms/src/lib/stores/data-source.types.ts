import { Observable } from 'rxjs';
import type { Entity } from '../models/schema.type';

export interface DocumentSource<T extends Entity> extends Observable<T[]> {
    readonly isLoading: Observable<boolean>;
    readonly hasMore: Observable<boolean>;
    loadNextPage(): Promise<void>;
    updateEntries(ids: string[], field: keyof T, value: unknown): Promise<void>;
    destroy(): void;
}

export interface DocumentSourceOptions<T extends Entity = Entity> {
    pageSize: number;
    realtimeThreshold: number;
    bulkEditUpdateSameValuesOnly: boolean;
    idField: keyof T;
}
