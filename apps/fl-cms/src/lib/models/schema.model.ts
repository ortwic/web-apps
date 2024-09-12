import type { DocumentData } from "firebase/firestore";
import type { EntityCollection } from "../packages/firecms_core/types/collections";

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type PureCollection = Omit<EntityCollection<{}>, 'subcollections'>;

export type Collection = PartialBy<PureCollection, 'properties'> & {
    pathSegments?: string[];
    parent?: Collection;
    subcollections?: Collection[];
};

export type Entity = {
    id: string;
} & DocumentData;