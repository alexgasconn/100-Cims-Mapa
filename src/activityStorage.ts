import type { StravaActivity } from './types';

const DATABASE_NAME = '100-cims-storage';
const STORE_NAME = 'activities';
const RECORD_KEY = 'latest-import';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

interface StoredActivities {
    key: string;
    savedAt: number;
    activities: StravaActivity[];
}

function openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DATABASE_NAME, 1);
        request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME, { keyPath: 'key' });
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function loadStoredActivities(): Promise<StravaActivity[]> {
    if (!('indexedDB' in window)) return [];
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
        const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(RECORD_KEY);
        request.onsuccess = () => {
            const stored = request.result as StoredActivities | undefined;
            if (!stored || Date.now() - stored.savedAt > MAX_AGE_MS) {
                database.close();
                if (stored) void clearStoredActivities();
                resolve([]);
                return;
            }
            database.close();
            resolve(Array.isArray(stored.activities) ? stored.activities : []);
        };
        request.onerror = () => {
            database.close();
            reject(request.error);
        };
    });
}

export async function saveStoredActivities(activities: StravaActivity[]): Promise<void> {
    if (!('indexedDB' in window) || activities.length === 0) return;
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
        const request = database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put({
            key: RECORD_KEY,
            savedAt: Date.now(),
            activities,
        } satisfies StoredActivities);
        request.onsuccess = () => {
            database.close();
            resolve();
        };
        request.onerror = () => {
            database.close();
            reject(request.error);
        };
    });
}

export async function clearStoredActivities(): Promise<void> {
    if (!('indexedDB' in window)) return;
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
        const request = database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(RECORD_KEY);
        request.onsuccess = () => {
            database.close();
            resolve();
        };
        request.onerror = () => {
            database.close();
            reject(request.error);
        };
    });
}
