"use client";

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import type { Campaign, MediaItem } from '@/lib/types';

const STORAGE_KEY = 'cybim_campaigns';

// The context shape
interface CampaignsContextType {
  campaigns: Campaign[];
  loaded: boolean;
  getCampaignById: (id: string) => Campaign | undefined;
  addCampaign: () => Campaign;
  updateCampaign: (updatedCampaign: Campaign) => void;
  deleteCampaign: (campaignId: string) => void;
}

// Create the context
const CampaignsContext = createContext<CampaignsContextType | undefined>(undefined);

// Helper function to get initial state from localStorage
const getInitialCampaigns = (): Campaign[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const item = window.localStorage.getItem(STORAGE_KEY);
    return item ? JSON.parse(item) : [];
  } catch (error) {
    console.error('Error reading campaigns from localStorage', error);
    return [];
  }
};

// The provider component
export function CampaignsProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setCampaigns(getInitialCampaigns());
    setLoaded(true);
  }, []);

  const getCampaignById = useCallback(
    (id: string) => {
      return campaigns.find((c) => c.id === id);
    },
    [campaigns]
  );
  
  const addCampaign = useCallback(() => {
    const existingNames = campaigns.map((c) => c.name);
    let newCampaignNumber = campaigns.length + 1;
    let newCampaignName = `Campaign ${String(newCampaignNumber).padStart(2, '0')}`;

    while (existingNames.includes(newCampaignName)) {
      newCampaignNumber++;
      newCampaignName = `Campaign ${String(newCampaignNumber).padStart(2, '0')}`;
    }

    const newCampaign: Campaign = {
      id: crypto.randomUUID(),
      name: newCampaignName,
      media: [],
    };
    const updatedCampaigns = [...campaigns, newCampaign];
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCampaigns));
        setCampaigns(updatedCampaigns);
    } catch(e) {
        console.error('Error saving campaigns to localStorage', e);
        throw e;
    }
    return newCampaign;
  }, [campaigns]);

  const updateCampaign = useCallback(
    (updatedCampaign: Campaign) => {
      setCampaigns(current => {
        const newCampaigns = current.map((c) =>
          c.id === updatedCampaign.id ? updatedCampaign : c
        );
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newCampaigns));
        } catch(e) {
            console.error('Error saving campaigns to localStorage', e);
            throw e;
        }
        return newCampaigns;
      });
    },
    []
  );

  const deleteCampaign = useCallback(
    (campaignId: string) => {
      setCampaigns(current => {
          const newCampaigns = current.filter((c) => c.id !== campaignId);
          try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newCampaigns));
          } catch(e) {
            console.error('Error saving campaigns to localStorage', e);
            throw e;
          }
          return newCampaigns;
      });
    },
    []
  );
  
  const value = { campaigns, loaded, getCampaignById, addCampaign, updateCampaign, deleteCampaign };

  return (
    <CampaignsContext.Provider value={value}>
      {children}
    </CampaignsContext.Provider>
  );
}

// The custom hook to consume the context
export function useCampaigns() {
  const context = useContext(CampaignsContext);
  if (context === undefined) {
    throw new Error('useCampaigns must be used within a CampaignsProvider');
  }
  return context;
}
