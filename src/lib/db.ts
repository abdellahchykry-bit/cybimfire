import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Campaign, AppSettings } from '@/lib/types';

const DB_NAME = 'cybim-db';
const DB_VERSION = 4; 
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
        if (oldVersion > 0 && oldVersion < 3) {
          if (db.objectStoreNames.contains(CAMPAIGNS_STORE)) {
            db.deleteObjectStore(CAMPAIGNS_STORE);
          }
        }
         if (oldVersion > 0 && oldVersion < 4) {
          if (db.objectStoreNames.contains(SETTINGS_STORE)) {
            db.deleteObjectStore(SETTINGS_STORE);
          }
        }

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
  try {
    const db = await getDb();
    if (!db) return []; // Return empty array on server
    const campaigns = await db.getAll(CAMPAIGNS_STORE);
    
    if (!Array.isArray(campaigns)) {
      console.error("Corrupted campaigns data in DB, expected an array.");
      return [];
    }
    
    // Defensively filter out any items that aren't valid campaign objects
    return campaigns.filter(c => typeof c === 'object' && c !== null && typeof c.id === 'string' && Array.isArray(c.media));
  } catch (error) {
    console.error("Failed to get campaigns from DB.", error);
    return [];
  }
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
  autoplayAll: false,
  defaultImageDuration: 10,
};

export async function getSettingsFromDb(): Promise<AppSettings> {
  try {
    const db = await getDb();
    if (!db) return DEFAULTS;
    
    let settings = await db.get(SETTINGS_STORE, SETTINGS_KEY);

    // If settings from DB is a string, it might be legacy JSON data.
    if (typeof settings === 'string') {
        if (settings) {
            settings = JSON.parse(settings);
        } else {
            settings = {}; // Empty string, treat as empty object
        }
    }
    
    if (settings && typeof settings === 'object' && !Array.isArray(settings)) {
      // Clean up old properties if they exist from previous versions
      if ('startupCampaignId' in settings) {
        delete (settings as any).startupCampaignId;
      }
      return { ...DEFAULTS, ...settings };
    }
  } catch (error) {
    console.error("Failed to load or parse settings from DB. Using defaults.", error);
  }
  
  // If anything fails or data is invalid, return defaults.
  return DEFAULTS;
}

export async function saveSettingsToDb(settings: AppSettings): Promise<void> {
  const db = await getDb();
  if (!db) return; // Do nothing on server
  await db.put(SETTINGS_STORE, settings, SETTINGS_KEY);
}
