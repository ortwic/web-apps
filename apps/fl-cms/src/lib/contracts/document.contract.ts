import type { Observable } from "rxjs";
import type { UpdateArgs } from "../models/schema.type";

export interface DocumentContract<T> {
    getDocument(id?: string): Observable<T | null>;
    setDocuments(args: UpdateArgs<T>): Promise<boolean>;
}