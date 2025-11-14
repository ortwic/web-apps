import type { FirebaseStorage, StorageReference } from "firebase/storage";
import { ref, listAll, getDownloadURL, uploadBytes } from "firebase/storage";
import { derived } from "svelte/store";
import { appStore } from "../app.store";
import type { StorageItem } from "../../models/storage.type";

export const currentStorage = derived(appStore, (app) => new StorageService(app.getStorage(), app.config.storageBucket));

function toFile(ref: StorageReference | null, type: 'folder' | 'file'): StorageItem {
    return ref ? {
        type,
        name: ref.name,
        bucket: ref.bucket,
        path: ref.fullPath,
        parent: toFile(ref.parent, 'folder')
    } : { } as StorageItem;
}

export class StorageService {
    readonly basePath: string;

    constructor(private storage: FirebaseStorage | null, bucket?: string) {
        this.basePath = `/b/${bucket}/o`;
    }

    async listAll(path: string): Promise<StorageItem[]> {
        if (this.storage) {
            const reference = await listAll(ref(this.storage, path));
            console.log(path, reference);
            return [
                ...reference.prefixes.map(i => toFile(i, 'folder')),
                ...reference.items.map(i => toFile(i, 'file'))
            ];
        }
        return [];
    }

    async getFileUrl(path: string): Promise<string> {
        if (this.storage) {
            const fileRef = ref(this.storage, path);
            return await getDownloadURL(fileRef);
        }
        return "";
    }

    async uploadFile(file: File, userId: string) {
        if (this.storage) {
            const fileRef = ref(this.storage, `files/${userId}/${file.name}`);
            const snapshot = await uploadBytes(fileRef, file);
            return await getDownloadURL(snapshot.ref);
        }
    }
}

