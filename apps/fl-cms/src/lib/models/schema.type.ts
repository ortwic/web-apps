import type { DocumentData } from "firebase/firestore";
import type { EntityCollection } from "../packages/firecms_core/types/collections";

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type PureCollection = Omit<EntityCollection<{}>, 'subcollections' | 'path' | 'id'>;

export type Collection = PartialBy<PureCollection, 'properties'> & {
    get id(): string;
    get path(): string;
    pathSegments?: readonly string[];
    parent?: Collection;
    subcollections?: Collection[];
};

export type Entity = {
    id: string;
    title?: string;
} & DocumentData;