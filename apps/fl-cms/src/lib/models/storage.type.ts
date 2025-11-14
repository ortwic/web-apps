export type StorageItem = {
    type: 'folder' | 'file';
    name: string;
    bucket: string;
    path: string;
    parent: StorageItem;
};

export type StorageFile = StorageItem & {
    url: string;
};