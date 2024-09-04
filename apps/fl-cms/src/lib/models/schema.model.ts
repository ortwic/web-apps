import type { EntityCollection as FireCMS_Collection } from "../packages/firecms_core/types/collections";
import type { Properties } from "../packages/firecms_core/types/properties";

export type EntityCollection = Omit<FireCMS_Collection, 'name'> & {
    properties: Properties;
};
