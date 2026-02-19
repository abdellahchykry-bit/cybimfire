"use client";

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import type { AppSettings } from '@/lib/types';

const STORAGE_KEY = 'cybim_settings';

const DEFAULTS: AppSettings = {
  orientation: 'landscape',
  autoStart: false,
  lastPlayedCampaignId: null,
};

// The context shape
interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

// Create the context
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);


// Helper function to get initial state from localStorage
const getInitialSettings = (): AppSettings => {
  if (typeof window === 'undefined') {
    return DEFAULTS;
  }
  try {
    const item = window.localStorage.getItem(STORAGE_KEY);
    return item ? { ...DEFAULTS, ...JSON.parse(item) } : DEFAULTS;
  } catch (error) {
    console.error('Error reading settings from localStorage', error);
    return DEFAULTS;
  }
};

// The provider component
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);

  useEffect(() => {
    setSettings(getInitialSettings());
  }, []);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(currentSettings => {
      const updated = { ...currentSettings, ...newSettings };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving settings to localStorage', error);
      }
      return updated;
    });
  }, []);

  const value = { settings, updateSettings };
  
  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

// The custom hook to consume the context
export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
