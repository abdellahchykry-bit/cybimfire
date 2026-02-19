"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Campaign, MediaItem } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const STORAGE_KEY = 'cybim_campaigns';

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

export function useCampaigns() {
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

  return { campaigns, getCampaignById, addCampaign, updateCampaign, deleteCampaign, addMediaItem };
}
