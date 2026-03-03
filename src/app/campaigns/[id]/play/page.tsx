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
  }, [id, loaded, getCampaignById, router]);
  
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
        
        // If autoplay all is on, turn it off when exiting.
        if (settings.autoplayAll) {
          updateSettings({ autoplayAll: false });
        }
        
        router.push('/');
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [router, settings.autoplayAll, updateSettings]);
  
  const goToNext = useCallback(() => {
    if (!campaign) return;
  
    const isLastItem = currentIndex === campaign.media.length - 1;
  
    if (isLastItem) {
      if (settings.autoplayAll && campaigns.length > 1) {
        const currentCampaignIndex = campaigns.findIndex(c => c.id === id);
        const nextCampaignIndex = (currentCampaignIndex + 1) % campaigns.length;
        const nextCampaignId = campaigns[nextCampaignIndex].id;
        router.replace(`/campaigns/${nextCampaignId}/play`);
      } else {
        // Loop current campaign
        setCurrentIndex(0);
        if (campaign.media.length === 1) { // Single-item campaign needs a forced re-render
            setLoopTrigger(t => t + 1);
        }
      }
    } else {
      // Go to next item in the same campaign
      setCurrentIndex(prev => prev + 1);
    }
  }, [campaign, currentIndex, settings.autoplayAll, campaigns, id, router]);

  
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
        videoElement.src = currentUrl;
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
        videoElement.pause();
        videoElement.src = '';
        videoElement.load();
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
            key={currentIndex + '-img' + loopTrigger}
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
            key={currentIndex + '-vid' + loopTrigger}
            ref={videoRef}
            playsInline
            muted
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
