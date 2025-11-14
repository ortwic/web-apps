import type { FirebaseStorage, StorageReference } from "firebase/storage";
import { ref, listAll, getDownloadURL, uploadBytes, deleteObject } from "firebase/storage";
import { derived } from "svelte/store";
import { appStore } from "../app.store";
import type { StorageItem } from "../../models/storage.type";
import { showError, showInfo } from "../notification.store";
import { BehaviorSubject, combineLatest, from, map, Observable, of, tap } from "rxjs";

export const currentStorage = derived(appStore, (app) => new StorageService(app.getStorage()));

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
        const virtual = this.newItems.value.find(i => i.path === path && i.type === 'virtual');
        if (virtual) {
            return of([]);
        }

        if (this.storage) {
            try {
                return combineLatest([
                    from(listAll(ref(this.storage, path))),
                    this.newItems
                ]).pipe(
                    map(([ref, items]) => ([
                        ...items.filter(i => i.parent?.path === path),
                        ...ref.prefixes.map(i => toStorageItem(i, 'folder')),
                        ...ref.items.map(i => toStorageItem(i, 'file'))
                    ])),
                    map((items) => items.toSorted(desc)),
                    tap((ref) => console.log({path}, ref))
                );
            } catch (error: any) {
                console.error(error);
                showError(error.message);
            }
        }
        return of([]);
    }

    async getFileUrl(path: string): Promise<string> {
        if (this.storage) {
            const fileRef = ref(this.storage, path);
            return await getDownloadURL(fileRef);
        }
        return "";
    }

    createFolder(path: string, name: string) {
        if (name) {
            const exists = this.newItems.value.find(i => i.name === name && i.parent?.path === path);
            if (!exists) {
                showInfo(`Folder ${path} already exists!`);
            }

            const folder = { 
                name, 
                path: `${path}/${name}`,
                parent: { path, type: 'folder' } as StorageItem, 
                type: 'virtual' 
            } as StorageItem;
            this.newItems.next([...this.newItems.value, folder]);
        }
    }

    async uploadFile(path: string, file: File): Promise<StorageItem | null> {
        if (this.storage) {
            const fileRef = ref(this.storage, `${path}/${file.name}`);
            try {
                const snapshot = await uploadBytes(fileRef, file);
                const item = toStorageItem(snapshot.ref, 'file');
                this.newItems.next([...this.newItems.value, item]);
                this.mayConfirmVirtual(item.path);
                return item;
            } catch (error: any) {
                showError(error.message);
            }
        }
        return null;
    }

    private mayConfirmVirtual(path: string) {
        const items = this.newItems.value;
        const virtual = items.find(i => i.path === path && i.type === 'virtual');
        if (virtual) {
            const i = items.indexOf(virtual);
            items[i].type = 'folder';
            this.newItems.next(items);
        }
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

