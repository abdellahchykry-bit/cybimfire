"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCampaigns } from '@/context/CampaignsContext';
import { useSettings } from '@/context/SettingsContext';
import type { MediaItem } from '@/lib/types';

const BLANK_IMAGE = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

export default function PlayAllPage() {
  const router = useRouter();
  const { campaigns, loaded: campaignsLoaded } = useCampaigns();
  const { settings, updateSettings, loaded: settingsLoaded } = useSettings();
  
  const [activeCampaignIndex, setActiveCampaignIndex] = useState(0);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<MediaItem | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const backButtonHandlerAttached = useRef(false);

  const loaded = campaignsLoaded && settingsLoaded;

  // Back button handler with special logic for this mode
  useEffect(() => {
    if (backButtonHandlerAttached.current) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Back') {
        event.preventDefault();
        updateSettings({ autoplayAll: false });
        router.push('/');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    backButtonHandlerAttached.current = true;
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      backButtonHandlerAttached.current = false;
    };
  }, [router, updateSettings]);

  const goToNext = useCallback(() => {
    if (!loaded || campaigns.length === 0) return;

    let nextMediaIndex = activeMediaIndex + 1;
    let nextCampaignIndex = activeCampaignIndex;

    const currentCampaign = campaigns[nextCampaignIndex];
    if (!currentCampaign || currentCampaign.media.length === 0) {
        // Skip empty or invalid campaign
        setActiveCampaignIndex(prev => (prev + 1) % campaigns.length);
        setActiveMediaIndex(0);
        return;
    }

    if (nextMediaIndex >= currentCampaign.media.length) {
      nextMediaIndex = 0;
      nextCampaignIndex = (activeCampaignIndex + 1) % campaigns.length;
    }
    
    setActiveMediaIndex(nextMediaIndex);
    setActiveCampaignIndex(nextCampaignIndex);
  }, [campaigns, activeCampaignIndex, activeMediaIndex, loaded]);


  // Main playback logic effect
  useEffect(() => {
    if (!loaded || campaigns.length === 0) return;
    
    const campaign = campaigns[activeCampaignIndex];
    if (!campaign || campaign.media.length === 0) {
        goToNext();
        return;
    };

    const item = campaign.media[activeMediaIndex];
    if (!item) {
        goToNext(); // Skip if item is somehow invalid
        return;
    };

    // --- Stop any previous playback ---
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const videoElement = videoRef.current;
    if (videoElement) {
        videoElement.onended = null;
        videoElement.onerror = null;
        if (!videoElement.paused) videoElement.pause();
    }

    const objectUrl = URL.createObjectURL(item.blob);
    setActiveUrl(objectUrl);
    setActiveItem(item);
    
    // --- Start new playback ---
    if (item.type === 'image') {
      timeoutRef.current = setTimeout(goToNext, settings.defaultImageDuration * 1000);
    } else if (item.type === 'video' && videoElement) {
      videoElement.src = objectUrl;
      videoElement.onended = goToNext;
      videoElement.onerror = goToNext; // Silently skip on error
      
      const playPromise = videoElement.play();
      if (playPromise !== undefined) {
        playPromise.catch(goToNext);
      }
    }

    return () => {
        if(objectUrl) {
            URL.revokeObjectURL(objectUrl);
        }
    };
  }, [activeCampaignIndex, activeMediaIndex, loaded, campaigns, settings.defaultImageDuration, goToNext]);
  
  if (!loaded) {
    return <div className="bg-black flex items-center justify-center h-screen w-screen" />;
  }

  if (campaigns.length === 0) {
    return (
        <div className="bg-black flex flex-col gap-4 items-center justify-center h-screen w-screen text-white">
            <p>There are no campaigns to play.</p>
            <button onClick={() => router.push('/')} className="px-4 py-2 border rounded">Go Back</button>
        </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">
      <div className="w-full h-full">
        <Image
            key={`${activeCampaignIndex}-${activeMediaIndex}-img`}
            src={(activeItem?.type === 'image' && activeUrl) ? activeUrl : BLANK_IMAGE}
            alt=""
            fill
            style={{ 
              objectFit: 'cover',
              opacity: activeItem?.type === 'image' ? 1 : 0,
              transition: 'opacity 0.5s ease-in-out',
            }}
            priority
            unoptimized
        />
        <video
            key={`${activeCampaignIndex}-${activeMediaIndex}-vid`}
            ref={videoRef}
            playsInline
            disableRemotePlayback
            className="w-full h-full object-cover"
            style={{ 
              opacity: activeItem?.type === 'video' ? 1 : 0,
              transition: 'opacity 0.5s ease-in-out',
            }}
        />
      </div>
    </div>
  );
}
