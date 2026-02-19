"use client";

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import type { Campaign, MediaItem } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const STORAGE_KEY = 'cybim_campaigns';

// The context shape
interface CampaignsContextType {
  campaigns: Campaign[];
  getCampaignById: (id: string) => Campaign | undefined;
  addCampaign: () => Campaign;
  updateCampaign: (updatedCampaign: Campaign) => void;
  deleteCampaign: (campaignId: string) => void;
  addMediaItem: (campaignId: string, type: 'image' | 'video') => void;
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

  useEffect(() => {
    setCampaigns(getInitialCampaigns());
  }, []);

  const saveCampaigns = useCallback((updatedCampaigns: Campaign[]) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCampaigns));
      setCampaigns(updatedCampaigns);
    } catch (error) {
      console.error('Error saving campaigns to localStorage', error);
    }
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
    saveCampaigns([...campaigns, newCampaign]);
    return newCampaign;
  }, [campaigns, saveCampaigns]);

  const updateCampaign = useCallback(
    (updatedCampaign: Campaign) => {
      const newCampaigns = campaigns.map((c) =>
        c.id === updatedCampaign.id ? updatedCampaign : c
      );
      saveCampaigns(newCampaigns);
    },
    [campaigns, saveCampaigns]
  );

  const deleteCampaign = useCallback(
    (campaignId: string) => {
      const newCampaigns = campaigns.filter((c) => c.id !== campaignId);
      saveCampaigns(newCampaigns);
    },
    [campaigns, saveCampaigns]
  );

  const addMediaItem = useCallback(
    (campaignId: string, type: 'image' | 'video') => {
      const campaign = getCampaignById(campaignId);
      if (!campaign) return;
      
      const placeholder = PlaceHolderImages[Math.floor(Math.random() * PlaceHolderImages.length)];
      
      const newItem: MediaItem = {
        id: crypto.randomUUID(),
        type: type,
        url: type === 'image' ? placeholder.imageUrl : "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        duration: 10, // Default duration for new images
      };
      
      const updatedCampaign = { ...campaign, media: [...campaign.media, newItem] };
      updateCampaign(updatedCampaign);
    },
    [getCampaignById, updateCampaign]
  );
  
  const value = { campaigns, getCampaignById, addCampaign, updateCampaign, deleteCampaign, addMediaItem };

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
