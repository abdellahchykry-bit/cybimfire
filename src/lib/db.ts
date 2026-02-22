import { openDB, type DBSchema } from 'idb';
import type { Campaign, AppSettings } from '@/lib/types';

const DB_NAME = 'cybim-db';
const DB_VERSION = 1;
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

const dbPromise = openDB<CybimDB>(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(CAMPAIGNS_STORE)) {
        db.createObjectStore(CAMPAIGNS_STORE, { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE);
    }
  },
});

// Campaign Functions
export async function getCampaignsFromDb(): Promise<Campaign[]> {
  return (await dbPromise).getAll(CAMPAIGNS_STORE);
}

export async function saveCampaignToDb(campaign: Campaign): Promise<void> {
    await (await dbPromise).put(CAMPAIGNS_STORE, campaign);
}

export async function deleteCampaignFromDb(id: string): Promise<void> {
    await (await dbPromise).delete(CAMPAIGNS_STORE, id);
}


// Settings Functions
const DEFAULTS: AppSettings = {
  orientation: 'landscape',
  autoStart: false,
  startOnBoot: false,
  lastPlayedCampaignId: null,
  defaultImageDuration: 10,
};

export async function getSettingsFromDb(): Promise<AppSettings> {
  const settings = await (await dbPromise).get(SETTINGS_STORE, SETTINGS_KEY);
  return settings ? { ...DEFAULTS, ...settings } : DEFAULTS;
}

export async function saveSettingsToDb(settings: AppSettings): Promise<void> {
  await (await dbPromise).put(SETTINGS_STORE, settings, SETTINGS_KEY);
}
