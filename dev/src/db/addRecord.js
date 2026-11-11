import { openDB } from './openDB.js';

export async function addRecord(storeName, record) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.add(record);

        request.onsuccess = () => resolve(record);
        request.onerror = () => reject(request.error);
    });
}
