import type { FirebaseStorage, StorageReference } from "firebase/storage";
import { ref, listAll, getDownloadURL, uploadBytes, deleteObject } from "firebase/storage";
import { derived } from "svelte/store";
import { appStore } from "../app.store";
import type { StorageItem } from "../../models/storage.type";
import { showError } from "../notification.store";
import { BehaviorSubject, combineLatest, from, map, Observable, of, tap } from "rxjs";

export const currentStorage = derived(appStore, (app) => new StorageService(app.getStorage()));

// Firebase Storage can't create empty folders
const dummyFile = { name: '.init' } as File;

function toStorageItem(ref: StorageReference | null, type: 'folder' | 'file'): StorageItem {
    return ref ? {
        type,
        name: ref.name,
        bucket: ref.bucket,
        path: ref.fullPath,
        parent: toStorageItem(ref.parent, 'folder')
    } : { } as StorageItem;
}

export class StorageService {
    private readonly newItems = new BehaviorSubject<StorageItem[]>([]);

    constructor(private storage: FirebaseStorage | null) {
    }

    listAll(path: string): Observable<StorageItem[]> {
        const desc = <T extends StorageItem>(a: T, b: T) => b.type.localeCompare(a.type);
        if (this.storage) {
            try {
                return combineLatest([
                    from(listAll(ref(this.storage, path))),
                    this.newItems
                ]).pipe(
                    map(([result, items]) => ([
                        ...items.filter(i => i.parent?.path === path),
                        ...result.prefixes.map(i => toStorageItem(i, 'folder')),
                        ...result.items
                            .filter(i => i.name !== dummyFile.name)
                            .map(i => toStorageItem(i, 'file'))
                    ])),
                    map((items) => items.toSorted(desc))
                );
            } catch (error: any) {
                console.error(error);
                showError(error.message);
            }
        }
        return of([]);
    }

    reset() {
        this.newItems.next([]);
    }

    async getFileUrl(path: string): Promise<string> {
        if (this.storage) {
            const fileRef = ref(this.storage, path);
            return await getDownloadURL(fileRef);
        }
        return "";
    }

    async createFolder(path: string, name: string) {
        if (this.storage) {
            const fileRef = ref(this.storage, `${path}/${name}/${dummyFile.name}`);
            try {
                const snapshot = await uploadBytes(fileRef, dummyFile);
                const folder: StorageItem = { 
                    name, 
                    type: 'folder',
                    path: `${path}/${name}`,
                    parent: { path, type: 'folder' } as StorageItem, 
                    bucket: snapshot.ref.bucket
                };
                this.newItems.next([...this.newItems.value, folder]);
            } catch (error: any) {
                showError(error.message);
            }
        }
    }

    async uploadFile(path: string, file: File): Promise<StorageItem | null> {
        if (this.storage) {
            const fileRef = ref(this.storage, `${path}/${file.name}`);
            try {
                const snapshot = await uploadBytes(fileRef, file);
                const item = toStorageItem(snapshot.ref, 'file');
                this.newItems.next([...this.newItems.value, item]);
                return item;
            } catch (error: any) {
                showError(error.message);
            }
        }
        return null;
    }

    async deleteFile(path: string): Promise<void> {
        if (this.storage) {
            const fileRef = ref(this.storage, path);
            try {
                await deleteObject(fileRef);
            } catch (error: any) {
                showError(error.message);
            }
        }
    }
}

