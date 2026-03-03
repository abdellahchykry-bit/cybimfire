"use client";

import { useState, useEffect, useRef } from 'react';
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
  
  // Consolidated playback logic
  useEffect(() => {
    if (!currentItem || !campaign) return;

    const goToNext = () => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % campaign.media.length);
    };
    
    // Always clear previous timer/listeners
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const videoElement = videoRef.current;
    if (videoElement) {
        videoElement.onended = null;
        videoElement.onerror = null;
        videoElement.oncanplaythrough = null;
    }

    if (currentItem.type === 'image') {
      timeoutRef.current = setTimeout(goToNext, settings.defaultImageDuration * 1000);
    }

    if (currentItem.type === 'video' && videoElement && currentUrl) {
      const isSingleMediaCampaign = campaign.media.length === 1;
      videoElement.loop = isSingleMediaCampaign;

      const handleVideoEnd = () => {
        if (!isSingleMediaCampaign) {
            goToNext();
        }
      };
      
      const handleVideoError = (e: Event | string) => {
        goToNext();
      };
      
      const playVideo = () => {
        videoElement.muted = true;
        const playPromise = videoElement.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            handleVideoError(error.toString());
          });
        }
      };

      videoElement.onended = handleVideoEnd;
      videoElement.onerror = handleVideoError;
      
      videoElement.oncanplaythrough = playVideo;

      if (videoElement.readyState >= 4) { // HAVE_ENOUGH_DATA
        playVideo();
      }
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentItem, currentUrl, campaign, settings.defaultImageDuration]);
  
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
            src={(currentItem?.type === 'image' && currentUrl) ? currentUrl : ""}
            alt=""
            fill
            style={{ 
              objectFit: 'cover', 
              display: currentItem?.type === 'image' ? 'block' : 'none' 
            }}
            priority
            unoptimized
        />
        <video
            key={currentIndex + '-vid'}
            ref={videoRef}
            src={(currentItem?.type === 'video' && currentUrl) ? currentUrl : ""}
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ display: currentItem?.type === 'video' ? 'block' : 'none' }}
            disableRemotePlayback
        />
      </div>
    </div>
  );
}
