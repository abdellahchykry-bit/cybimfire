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
  const { settings, updateSettings, loaded: settingsLoaded } = useSettings();
  
  const [campaign, setCampaign] = useState<Campaign | undefined>(undefined);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loopTrigger, setLoopTrigger] = useState(0);
  
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loaded = campaignsLoaded && settingsLoaded;

  // Load campaign data
  useEffect(() => {
    if (loaded) {
      const foundCampaign = getCampaignById(id);
      if (foundCampaign) {
        setCampaign(foundCampaign);
      } else {
        // If campaign not found, go home. Could happen if it was deleted.
        router.push('/');
      }
    }
  }, [id, loaded, campaigns, getCampaignById, router]);
  
  const currentItem = campaign?.media[currentIndex];

  // Create blob URL for current media item
  useEffect(() => {
    let objectUrl: string | null = null;
    if (currentItem?.blob) {
      objectUrl = URL.createObjectURL(currentItem.blob);
      setCurrentUrl(objectUrl);
    } else {
      setCurrentUrl(null);
    }
    
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [currentItem]);


  // Back button handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Back') {
        event.preventDefault();
        
        // If this was the auto-started campaign, disable the setting.
        if (settings.startupCampaignId === id) {
          updateSettings({ startupCampaignId: null });
        }
        
        router.push('/');
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [router, id, settings.startupCampaignId, updateSettings]);
  
  const goToNext = useCallback(() => {
    if (!campaign) return;
  
    const isLastItem = currentIndex === campaign.media.length - 1;
  
    if (isLastItem) {
      // Loop current campaign
      if (campaign.media.length === 1) { // Single-item campaign needs a forced re-render
          setLoopTrigger(t => t + 1);
      } else {
          setCurrentIndex(0);
      }
    } else {
      // Go to next item in the same campaign
      setCurrentIndex(prev => prev + 1);
    }
  }, [campaign, currentIndex]);

  
  // Consolidated playback logic
  useEffect(() => {
    if (!currentItem || !campaign || !currentUrl) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const videoElement = videoRef.current;

    const handleVideoEnd = () => {
      goToNext();
    };

    const handleVideoError = () => {
      // Silently skip to next item on error
      goToNext();
    };

    if (currentItem.type === 'image') {
      timeoutRef.current = setTimeout(goToNext, settings.defaultImageDuration * 1000);
    }

    if (currentItem.type === 'video' && videoElement) {
      videoElement.onended = handleVideoEnd;
      videoElement.onerror = handleVideoError;
      
      const playPromise = videoElement.play();
      if (playPromise !== undefined) {
        playPromise.catch(handleVideoError);
      }
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (videoElement) {
        videoElement.onended = null;
        videoElement.onerror = null;
      }
    };
  }, [currentItem, currentUrl, campaign, settings.defaultImageDuration, goToNext, loopTrigger]);
  
  if (!loaded || !campaign) {
    return <div className="bg-black flex items-center justify-center h-screen w-screen text-white" />;
  }

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
      <div className="w-full h-full">
        <Image
            key={currentIndex + '-img'}
            src={(currentItem?.type === 'image' && currentUrl) ? currentUrl : "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"}
            alt=""
            fill
            style={{ 
              objectFit: 'cover', 
              opacity: currentItem?.type === 'image' ? 1 : 0,
              transition: 'opacity 0.5s ease-in-out',
            }}
            priority
            unoptimized
        />
        <video
            key={currentIndex + '-vid'}
            ref={videoRef}
            src={(currentItem?.type === 'video' && currentUrl) ? currentUrl : undefined}
            playsInline
            muted
            autoPlay
            className="w-full h-full object-cover"
            style={{ 
              opacity: currentItem?.type === 'video' ? 1 : 0,
              transition: 'opacity 0.5s ease-in-out',
            }}
            disableRemotePlayback
        />
      </div>
    </div>
  );
}
