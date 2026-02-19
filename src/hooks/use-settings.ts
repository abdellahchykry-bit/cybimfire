"use client";

import { useState, useEffect, useCallback } from 'react';
import type { AppSettings } from '@/lib/types';

const STORAGE_KEY = 'cybim_settings';

const DEFAULTS: AppSettings = {
  orientation: 'landscape',
  autoStart: false,
  lastPlayedCampaignId: null,
};

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

export function useSettings() {
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

  return { settings, updateSettings };
}
