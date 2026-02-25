import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Campaign, AppSettings } from '@/lib/types';

const DB_NAME = 'cybim-db';
const DB_VERSION = 3; // Bump version to trigger upgrade for new data structure
const CAMPAIGNS_STORE = 'campaigns';
const SETTINGS_STORE = 'settings';
const SETTINGS_KEY = 'app-settings';

interface CybimDB extends DBSchema {
  [CAMPAIGNS_STORE]: {
    key: string;
    value: Campaign;
  };
  [SETTINGS_STORE]: {
    key: string;
    value: AppSettings;
  };
}

let dbPromise: Promise<IDBPDatabase<CybimDB>> | undefined;

function getDb() {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return null;
  }
  if (!dbPromise) {
    dbPromise = openDB<CybimDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        // If upgrading from a version before 3, clear out the old object stores
        // to prevent issues with incompatible data structures (e.g. url -> blob).
        if (oldVersion > 0 && oldVersion < 3) {
          if (db.objectStoreNames.contains(CAMPAIGNS_STORE)) {
            db.deleteObjectStore(CAMPAIGNS_STORE);
          }
          if (db.objectStoreNames.contains(SETTINGS_STORE)) {
            db.deleteObjectStore(SETTINGS_STORE);
          }
        }

        // Create stores if they don't exist
        if (!db.objectStoreNames.contains(CAMPAIGNS_STORE)) {
            db.createObjectStore(CAMPAIGNS_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
            db.createObjectStore(SETTINGS_STORE);
        }
      },
    });
  }
  return dbPromise;
}

// Campaign Functions
export async function getCampaignsFromDb(): Promise<Campaign[]> {
  const db = await getDb();
  if (!db) return []; // Return empty array on server
  const campaigns = await db.getAll(CAMPAIGNS_STORE);
  // Defensively filter out any items that aren't valid campaign objects
  return campaigns.filter(c => typeof c === 'object' && c !== null && typeof c.id === 'string' && Array.isArray(c.media));
}

export async function saveCampaignToDb(campaign: Campaign): Promise<void> {
    const db = await getDb();
    if (!db) return; // Do nothing on server
    await db.put(CAMPAIGNS_STORE, campaign);
}

export async function deleteCampaignFromDb(id: string): Promise<void> {
    const db = await getDb();
    if (!db) return; // Do nothing on server
    await db.delete(CAMPAIGNS_STORE, id);
}


// Settings Functions
const DEFAULTS: AppSettings = {
  orientation: 'landscape',
  lastPlayedCampaignId: null,
  defaultImageDuration: 10,
};

export async function getSettingsFromDb(): Promise<AppSettings> {
  const db = await getDb();
  if (!db) return DEFAULTS; // Return defaults on server
  const settings = await db.get(SETTINGS_STORE, SETTINGS_KEY);
  // Defensively ensure settings is an object before spreading
  const cleanSettings = (typeof settings === 'object' && settings !== null) ? settings : {};
  return { ...DEFAULTS, ...cleanSettings };
}

export async function saveSettingsToDb(settings: AppSettings): Promise<void> {
  const db = await getDb();
  if (!db) return; // Do nothing on server
  await db.put(SETTINGS_STORE, settings, SETTINGS_KEY);
}
