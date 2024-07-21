export interface GameDescription {
    id: string;
    path: string;
    title: string;
    description: string;
    description_de: string;
    levels: string[];
    levels_de: string[];
}

export interface GameContent {
    id: string;
    level: number;
    content: string;
    content_de: string;
}