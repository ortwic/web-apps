import type { DocumentData } from "firebase/firestore";

export interface Entity extends DocumentData {
    id: string;
    collections: <T extends Entity>() => Record<string, T[]>;
}

export interface GameDescription extends Entity {
    public: boolean;
    repeat: boolean;
    path: string;
    title: string;
    description: string;
    description_de: string;
    tags: string[];
    levels: string[] | string;
    levels_de: string[] | string;
}

export interface GameContent extends Entity {
    id: string;
    level: number;
    content: string;
    content_de: string;
}