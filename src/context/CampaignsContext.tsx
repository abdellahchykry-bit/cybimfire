"use client";

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import type { Campaign } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getCampaignsFromDb, saveCampaignToDb, deleteCampaignFromDb } from '@/lib/db';

interface CampaignsContextType {
  campaigns: Campaign[];
  loaded: boolean;
  getCampaignById: (id: string) => Campaign | undefined;
  addCampaign: () => Promise<Campaign | null>;
  updateCampaign: (updatedCampaign: Campaign) => Promise<void>;
  deleteCampaign: (campaignId: string) => Promise<void>;
}

const CampaignsContext = createContext<CampaignsContextType | undefined>(undefined);

export function CampaignsProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loaded, setLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function loadCampaigns() {
      try {
        const storedCampaigns = await getCampaignsFromDb();
        setCampaigns(storedCampaigns);
      } catch (error) {
        console.error("Failed to load campaigns from DB", error);
        toast({
          variant: "destructive",
          title: "Load Failed",
          description: "Could not load campaign data."
        });
      } finally {
        setLoaded(true);
      }
    }
    loadCampaigns();
  }, [toast]);

  const getCampaignById = useCallback(
    (id: string) => {
      return campaigns.find((c) => c.id === id);
    },
    [campaigns]
  );
  
  const addCampaign = useCallback(async () => {
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
    
    try {
      await saveCampaignToDb(newCampaign);
      setCampaigns(prev => [...prev, newCampaign]);
      return newCampaign;
    } catch (e) {
      console.error("Failed to save new campaign", e);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: "Could not create new campaign.",
      });
      return null;
    }
  }, [campaigns, toast]);

  const updateCampaign = useCallback(async (updatedCampaign: Campaign) => {
    try {
        await saveCampaignToDb(updatedCampaign);
        setCampaigns(prev => prev.map((c) =>
          c.id === updatedCampaign.id ? updatedCampaign : c
        ));
    } catch(e) {
        console.error("Failed to update campaign", e);
        toast({
          variant: 'destructive',
          title: 'Storage Error',
          description: "Could not save campaign changes. The storage may be full.",
        });
    }
  }, [toast]);

  const deleteCampaign = useCallback(async (campaignId: string) => {
      try {
        await deleteCampaignFromDb(campaignId);
        setCampaigns(prev => prev.filter((c) => c.id !== campaignId));
      } catch(e) {
        console.error('Failed to delete campaign', e);
        toast({
          variant: 'destructive',
          title: 'Delete Failed',
          description: 'Could not delete campaign.',
      });
      }
  }, [toast]);
  
  const value = { campaigns, loaded, getCampaignById, addCampaign, updateCampaign, deleteCampaign };

  return (
    <CampaignsContext.Provider value={value}>
      {children}
    </CampaignsContext.Provider>
  );
}

export function useCampaigns() {
  const context = useContext(CampaignsContext);
  if (context === undefined) {
    throw new Error('useCampaigns must be used within a CampaignsProvider');
  }
  return context;
}
