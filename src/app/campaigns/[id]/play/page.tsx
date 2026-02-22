"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { useCampaigns } from '@/context/CampaignsContext';
import { useSettings } from '@/context/SettingsContext';
import type { Campaign } from '@/lib/types';

export default function PlayPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { getCampaignById, campaigns, loaded: campaignsLoaded } = useCampaigns();
  const { updateSettings, loaded: settingsLoaded } = useSettings();
  
  const [campaign, setCampaign] = useState<Campaign | undefined>(undefined);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loaded = campaignsLoaded && settingsLoaded;

  useEffect(() => {
    if (loaded) {
      const foundCampaign = getCampaignById(id);
      if (foundCampaign) {
        setCampaign(foundCampaign);
      } else {
        router.push('/');
      }
    }
  }, [id, loaded, campaigns, getCampaignById, router]);

  useEffect(() => {
    if (loaded && campaign) {
      updateSettings({ lastPlayedCampaignId: id });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, loaded, campaign]); // updateSettings is stable

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsExiting(true);
        router.push('/');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);
  
  const goToNext = useCallback(() => {
    if (!campaign || campaign.media.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % campaign.media.length);
  }, [campaign]);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!campaign || campaign.media.length === 0 || isExiting) return;

    const currentItem = campaign.media[currentIndex];

    if (currentItem.type === 'image') {
      timeoutRef.current = setTimeout(goToNext, currentItem.duration * 1000);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentIndex, campaign, isExiting, goToNext]);
  
  const handleVideoEnd = () => {
    goToNext();
  };
  
  if (!loaded || !campaign) {
    return (
        <div className="bg-black flex flex-col gap-4 items-center justify-center h-screen w-screen text-white" />
    );
  }
  
  const currentItem = campaign?.media[currentIndex];

  if (campaign.media.length === 0) {
    return (
        <div className="bg-black flex flex-col gap-4 items-center justify-center h-screen w-screen text-white">
            <p>This campaign has no media.</p>
            <button onClick={() => router.push('/')} className="px-4 py-2 border rounded">Go Back</button>
        </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">
      {currentItem?.type === 'image' && (
        <Image
          key={currentItem.id}
          src={currentItem.url}
          alt=""
          layout="fill"
          objectFit="contain"
          priority
          unoptimized
        />
      )}
      {currentItem?.type === 'video' && (
        <video
          key={currentItem.id}
          ref={videoRef}
          src={currentItem.url}
          autoPlay
          muted
          onEnded={handleVideoEnd}
          className="w-full h-full object-contain"
        />
      )}
    </div>
  );
}
