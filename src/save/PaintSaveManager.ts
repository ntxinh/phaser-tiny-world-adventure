export interface PaintSaveData {
  svgId: string;
  canvasPng: string;
  savedAt: number;
}

const DB_NAME    = 'MagicPaintHouse';
const DB_VERSION = 1;
const STORE_NAME = 'autosave';
const RECORD_KEY = 'current';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess  = (e) => resolve((e.target as IDBOpenDBRequest).result);
    req.onerror    = (e) => reject((e.target as IDBOpenDBRequest).error);
  });
}

export class PaintSaveManager {
  async save(svgId: string, canvasPng: string): Promise<void> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx    = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record: PaintSaveData = { svgId, canvasPng, savedAt: Date.now() };
      const req   = store.put(record, RECORD_KEY);
      req.onsuccess = () => { db.close(); resolve(); };
      req.onerror   = (e) => { db.close(); reject((e.target as IDBRequest).error); };
    });
  }

  async load(): Promise<PaintSaveData | null> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx    = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req   = store.get(RECORD_KEY);
      req.onsuccess = (e) => {
        db.close();
        resolve((e.target as IDBRequest<PaintSaveData>).result ?? null);
      };
      req.onerror = (e) => { db.close(); reject((e.target as IDBRequest).error); };
    });
  }

  async clear(): Promise<void> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx    = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req   = store.delete(RECORD_KEY);
      req.onsuccess = () => { db.close(); resolve(); };
      req.onerror   = (e) => { db.close(); reject((e.target as IDBRequest).error); };
    });
  }
}
