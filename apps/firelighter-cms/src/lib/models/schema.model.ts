import type { EntityCollection as FireCMS_Collection } from "$lib/packages/firecms_core/types/collections";
import type { Properties } from "$lib/packages/firecms_core/types/properties";

export type EntityCollection = Omit<FireCMS_Collection, 'name'> & {
    properties: Properties;
};
