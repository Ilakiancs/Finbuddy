import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'finbuddy_offline';
const DB_VERSION = 1;

type SyncableData = {
  lastSynced?: Date;
  pending?: boolean;
  data: any;
};

// Initialize IndexedDB
async function initializeDB(): Promise<IDBPDatabase> {
  if (!browser) return null;

  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create stores for each data type
      db.createObjectStore('expenses');
      db.createObjectStore('budgets');
      db.createObjectStore('goals');
      db.createObjectStore('insights');
      db.createObjectStore('sync_meta');
    }
  });
}

// Create a store that syncs with IndexedDB and the backend
export function createSyncStore<T>(storeName: string, initialValue: T) {
  // Create the Svelte store
  const store = writable<SyncableData>({
    lastSynced: undefined,
    pending: false,
    data: initialValue
  });

  // Initialize from IndexedDB if available
  if (browser) {
    // Load data from IndexedDB when store is created
    initializeDB().then(async (db) => {
      if (!db) return;
      
      try {
        const storedValue = await db.get(storeName, 'current');
        if (storedValue) {
          store.set(storedValue);
        }
      } catch (error) {
        console.error(`Error loading ${storeName} from IndexedDB:`, error);
      }
    });

    // Subscribe to changes and update IndexedDB
    const unsubscribe = store.subscribe(async (value) => {
      const db = await initializeDB();
      if (!db) return;

      try {
        await db.put(storeName, value, 'current');
      } catch (error) {
        console.error(`Error storing ${storeName} to IndexedDB:`, error);
      }
    });
  }

  // Sync with the server when online
  async function sync() {
    if (!browser || !navigator.onLine) {
      return false;
    }

    const currentValue = get(store);
    
    // Mark as syncing in progress
    store.update(s => ({ ...s, pending: true }));
    
    try {
      // Get JWT token from auth store/localStorage
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        throw new Error('User not authenticated');
      }
      
      const response = await fetch(`/api/${storeName}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          lastSynced: currentValue.lastSynced,
          data: currentValue.data
        })
      });

      if (!response.ok) {
        throw new Error(`Sync failed with status: ${response.status}`);
      }

      const serverData = await response.json();
      
      // Update the store with server data and sync timestamp
      store.set({
        data: serverData.data,
        lastSynced: new Date(),
        pending: false
      });

      return true;
    } catch (error) {
      console.error(`Sync failed for ${storeName}:`, error);
      
      // Mark sync as no longer pending, but keep data as is
      store.update(s => ({ ...s, pending: false }));
      
      return false;
    }
  }

  // Update local data
  function update(updaterFn: (data: T) => T) {
    store.update(current => ({
      ...current,
      data: updaterFn(current.data)
    }));
  }

  // Set data directly
  function set(newData: T) {
    store.update(current => ({
      ...current,
      data: newData
    }));
  }

  // Get current data
  function getData(): T {
    return get(store).data;
  }

  return {
    subscribe: store.subscribe,
    update,
    set,
    sync,
    getData
  };
}

// Network status store
export const networkStatus = writable({
  online: browser ? navigator.onLine : true,
  backendAvailable: true
});

// Setup network status listeners
if (browser) {
  window.addEventListener('online', () => {
    networkStatus.update(s => ({ ...s, online: true }));
  });
  
  window.addEventListener('offline', () => {
    networkStatus.update(s => ({ ...s, online: false }));
  });
  
  // Periodically check if backend is available when online
  setInterval(async () => {
    if (!navigator.onLine) return;
    
    try {
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache' 
      });
      networkStatus.update(s => ({ ...s, backendAvailable: response.ok }));
    } catch (e) {
      networkStatus.update(s => ({ ...s, backendAvailable: false }));
    }
  }, 30000);
}