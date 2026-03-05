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

  const loaded = campaignsLoaded && settingsLoaded;

  const handleExit = useCallback(() => {
    // If autoplay was on, turn it off when exiting.
    if (settings.autoplayAll) {
      updateSettings({ autoplayAll: false });
    }
    router.push('/');
  }, [router, settings.autoplayAll, updateSettings]);

  // Effect to handle exit gestures
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleExit();
      }
    };
    
    window.addEventListener('popstate', handleExit);
    window.addEventListener('keydown', handleKeyDown);

    // Push a new state to the history so the popstate event fires on back.
    history.pushState(null, '', location.href);

    return () => {
      window.removeEventListener('popstate', handleExit);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleExit]);

  const goToNext = useCallback(() => {
    if (!loaded) return;

    const playableCampaigns = campaigns.filter(c => c.media.length > 0);
    if (playableCampaigns.length === 0) {
      router.push('/');
      return;
    }

    let currentCampaign = playableCampaigns.find(c => c.id === campaigns[activeCampaignIndex]?.id);
    
    // Find the actual current campaign in the playable list
    let currentPlayableIndex = playableCampaigns.findIndex(c => c.id === currentCampaign?.id);
    if (currentPlayableIndex === -1) {
        currentPlayableIndex = 0;
        currentCampaign = playableCampaigns[0];
    }
    
    if (!currentCampaign) {
      router.push('/');
      return;
    }

    let nextMediaIndex = activeMediaIndex + 1;
    let nextPlayableIndex = currentPlayableIndex;

    if (nextMediaIndex >= currentCampaign.media.length) {
      nextMediaIndex = 0;
      nextPlayableIndex = (currentPlayableIndex + 1) % playableCampaigns.length;
    }
    
    const nextCampaignId = playableCampaigns[nextPlayableIndex].id;
    const nextOriginalIndex = campaigns.findIndex(c => c.id === nextCampaignId);

    setActiveMediaIndex(nextMediaIndex);
    setActiveCampaignIndex(nextOriginalIndex >= 0 ? nextOriginalIndex : 0);
  }, [campaigns, activeCampaignIndex, activeMediaIndex, loaded, router]);


  // Main playback logic effect
  useEffect(() => {
    if (!loaded) return;
    
    const playableCampaigns = campaigns.filter(c => c.media.length > 0);
    if (playableCampaigns.length === 0) {
        if(campaignsLoaded) router.push('/');
        return;
    }
    
    const campaign = campaigns[activeCampaignIndex];
    if (!campaign || campaign.media.length === 0) {
        goToNext();
        return;
    };

    const item = campaign.media[activeMediaIndex];
    if (!item) {
        goToNext(); 
        return;
    };

    // --- Stop any previous playback ---
    const videoElement = videoRef.current;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
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
      timeoutRef.current = setTimeout(goToNext, item.duration * 1000);
    } else if (item.type === 'video' && videoElement) {
      videoElement.onended = goToNext;
      videoElement.onerror = goToNext; // Silently skip on error
      videoElement.src = objectUrl;

       // Muted autoplay workaround for webviews
      videoElement.muted = true;
      const playPromise = videoElement.play();

      if (playPromise !== undefined) {
        playPromise.then(() => {
            // Unmute once playback has started.
            videoElement.muted = false;
        }).catch(err => {
            // If even muted autoplay fails, just skip.
            goToNext();
        });
      }
    }

    return () => {
        if(objectUrl) {
            URL.revokeObjectURL(objectUrl);
        }
    };
  }, [activeCampaignIndex, activeMediaIndex, loaded, campaigns, goToNext, router, campaignsLoaded]);
  
  if (!loaded) {
    return <div className="bg-black flex items-center justify-center h-screen w-screen" />;
  }

  if (campaigns.filter(c => c.media.length > 0).length === 0 && loaded) {
    return (
        <div className="bg-black flex flex-col gap-4 items-center justify-center h-screen w-screen text-white">
            <p>There are no campaigns with media to play.</p>
        </div>
    );
  }

  return (
    <div onDoubleClick={handleExit} className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">
      <div className="w-full h-full">
        <Image
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
