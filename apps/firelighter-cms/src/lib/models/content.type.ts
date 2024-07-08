export type TypedValue = {
    value: string;
    type: 'text';
} | {
    value: object;
    type: string;
};