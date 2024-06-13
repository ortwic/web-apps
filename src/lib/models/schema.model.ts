export interface EntityCollection {
    id: string;
    path: string;
    props: Property[];
}

interface Property {
    name: string;
    type: string;
    required: boolean;
    unique: boolean;
    default: string;
    enum: string[];
}