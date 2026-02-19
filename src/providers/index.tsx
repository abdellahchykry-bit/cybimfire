"use client";

import { ReactNode } from 'react';
import { SettingsProvider } from '@/context/SettingsContext';
import { CampaignsProvider } from '@/context/CampaignsContext';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <CampaignsProvider>{children}</CampaignsProvider>
    </SettingsProvider>
  );
}
