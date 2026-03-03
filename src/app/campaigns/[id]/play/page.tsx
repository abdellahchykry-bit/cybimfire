"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { useCampaigns } from '@/context/CampaignsContext';
import { useSettings } from '@/context/SettingsContext';
import type { Campaign } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function PlayPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { getCampaignById, campaigns, loaded: campaignsLoaded } = useCampaigns();
  const { settings, updateSettings, loaded: settingsLoaded } = useSettings();
  const { toast } = useToast();
  
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
    if (!currentItem || !currentUrl || !campaign) return;

    const goToNext = () => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % campaign.media.length);
    };
    
    // Always clear previous timer/listeners
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const videoElement = videoRef.current;
    if (videoElement) {
        videoElement.onended = null;
        videoElement.onerror = null;
        videoElement.oncanplaythrough = null; // Clean up previous listener
    }

    if (currentItem.type === 'image') {
      timeoutRef.current = setTimeout(goToNext, settings.defaultImageDuration * 1000);
    }

    if (currentItem.type === 'video' && videoElement) {
      const isSingleMediaCampaign = campaign.media.length === 1;
      videoElement.loop = isSingleMediaCampaign;

      const handleVideoEnd = () => {
        if (!isSingleMediaCampaign) {
            goToNext();
        }
      };
      
      const handleVideoError = (e: Event | string) => {
        // Fix for the reported console error
        toast({ variant: 'destructive', title: 'Playback Error', description: 'Could not play video file.' });
        goToNext();
      };
      
      const playVideo = () => {
        videoElement.muted = true; // Ensure muted for autoplay
        const playPromise = videoElement.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            // A rejected play promise is a fatal error for this video.
            handleVideoError(error.toString());
          });
        }
      };

      videoElement.onended = handleVideoEnd;
      videoElement.onerror = handleVideoError;
      
      videoElement.oncanplaythrough = playVideo;

      // In some cases, 'oncanplaythrough' may have already fired. Check the readyState.
      if (videoElement.readyState >= 4) { // HAVE_ENOUGH_DATA
        playVideo();
      }
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentItem, currentUrl, campaign, settings.defaultImageDuration, toast]);
  
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
        {currentItem?.type === 'image' && currentUrl && (
          <Image
            key={currentUrl}
            src={currentUrl}
            alt=""
            fill
            style={{ objectFit: 'cover' }}
            priority
            unoptimized
          />
        )}
        {currentItem?.type === 'video' && currentUrl && (
          <video
            key={currentUrl}
            ref={videoRef}
            src={currentUrl}
            playsInline
            muted
            className="w-full h-full object-cover"
            disableRemotePlayback
          />
        )}
      </div>
    </div>
  );
}
