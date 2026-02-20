"use client";

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import type { Campaign, MediaItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

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
    const newCampaign: Campaign = {
      id: crypto.randomUUID(),
      name: '', // This will be set inside the state update
      media: [],
    };

    setCampaigns(currentCampaigns => {
      const existingNames = currentCampaigns.map((c) => c.name);
      let newCampaignNumber = currentCampaigns.length + 1;
      let newCampaignName = `Campaign ${String(newCampaignNumber).padStart(2, '0')}`;
  
      while (existingNames.includes(newCampaignName)) {
        newCampaignNumber++;
        newCampaignName = `Campaign ${String(newCampaignNumber).padStart(2, '0')}`;
      }
      
      const campaignWithCorrectName = { ...newCampaign, name: newCampaignName };
      const updatedCampaigns = [...currentCampaigns, campaignWithCorrectName];

      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCampaigns));
      } catch (e) {
        toast({
          variant: 'destructive',
          title: 'Storage Limit Reached',
          description: "Could not create campaign. Your browser's storage may be full.",
        });
        // Revert state if save fails
        return currentCampaigns;
      }
      return updatedCampaigns;
    });

    return newCampaign;
  }, [toast]);

  const updateCampaign = useCallback(
    (updatedCampaign: Campaign) => {
      setCampaigns(current => {
        const newCampaigns = current.map((c) =>
          c.id === updatedCampaign.id ? updatedCampaign : c
        );
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newCampaigns));
        } catch(e) {
            toast({
              variant: 'destructive',
              title: 'Storage Limit Reached',
              description: "Could not save media. Your browser's storage may be full.",
            });
            // Revert to previous state on error
            return current;
        }
        return newCampaigns;
      });
    },
    [toast]
  );

  const deleteCampaign = useCallback(
    (campaignId: string) => {
      setCampaigns(current => {
          const newCampaigns = current.filter((c) => c.id !== campaignId);
          try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newCampaigns));
          } catch(e) {
            console.error('Error saving campaigns to localStorage', e);
            // State is already updated, but localStorage is not. This is not ideal but hard to revert.
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
