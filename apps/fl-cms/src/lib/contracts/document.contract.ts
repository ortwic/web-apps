import type { Observable } from "rxjs";

export interface DocumentContract<T> {
    getDocument(id?: string): Observable<T | null>;
    setDocuments(...documents: T[]): Promise<boolean>;
}