import type { Observable } from "rxjs";

export interface DocumentContract<T> {
    getDocument(id?: string): Observable<T | null>;
    setDocument(document: T, merge?: boolean): Promise<boolean>;
}