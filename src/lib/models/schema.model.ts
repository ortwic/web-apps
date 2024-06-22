import type { Properties } from "../../firecms_core/types";

export interface EntityCollection {
    id: string;
    path: string;
    props: Properties;
}

// type Enum = { id: string; label: string; };
// type Validation = {    
//     required: boolean;
//     unique: boolean;
// };

// type Property = {
//     dataType: Omit<DataType, 'map'>;
//     name: string;
//     validation: Validation;
//     editable: boolean;
//     default: string;
//     enumValues: Enum[];
// } & {
//     dataType: 'map';
//     properties: Record<string, Property>;
// };
