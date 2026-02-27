"use client";

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import type { AppSettings } from '@/lib/types';
import { getSettingsFromDb, saveSettingsToDb } from '@/lib/db';

const DEFAULTS: AppSettings = {
  orientation: 'landscape',
  startupCampaignId: null,
  defaultImageDuration: 10,
};

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  loaded: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const storedSettings = await getSettingsFromDb();
      setSettings(storedSettings);
      setLoaded(true);
    }
    loadSettings();
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    setSettings(currentSettings => {
      const updated = { ...currentSettings, ...newSettings };
      saveSettingsToDb(updated).catch(error => {
          console.error("Failed to save settings to DB", error);
      });
      return updated;
    });
  }, []);

  const value = { settings, updateSettings, loaded };
  
  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
