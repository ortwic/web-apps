import type { Collection } from "../lib/models/schema.model";

export const schemeNestedSub: Collection = {
    id: 'sub11',
    path: 'root/sub1/sub11',
    name: 'Nested Sub',
    properties: {
        prop111: {
            name: 'Prop 1.1.1',
            dataType: 'string'
        }
    }
};
export const schemeSub: Collection = {
    id: 'sub1',
    path: 'root/sub1',
    name: 'Sub',
    properties: {
        prop11: {
            name: 'Prop 1.1',
            dataType: 'string'
        }
    },
    subcollections: [schemeNestedSub]
};
export const schemeRoot: Collection = {
    id: 'root',
    path: 'root',
    name: 'Root',
    properties: {
        prop1: {
            name: 'Prop 1',
            dataType: 'string'
        }
    },
    subcollections: [schemeSub]
};
