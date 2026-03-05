"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { useCampaigns } from '@/context/CampaignsContext';
import { useSettings } from '@/context/SettingsContext';
import type { Campaign, MediaItem } from '@/lib/types';

const BLANK_IMAGE = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

export default function PlayPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter(); // Keep router for initial navigation checks
  const { getCampaignById, loaded: campaignsLoaded } = useCampaigns();
  const { loaded: settingsLoaded } = useSettings();
  
  const [campaign, setCampaign] = useState<Campaign | undefined>(undefined);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loopTrigger, setLoopTrigger] = useState(0); 

  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<MediaItem | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loaded = campaignsLoaded && settingsLoaded;

  // Effect to disable back navigation and Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
      }
    };
    
    const handlePopState = () => {
      history.pushState(null, '', location.href);
    };

    window.addEventListener('keydown', handleKeyDown);
    history.pushState(null, '', location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);


  // Load campaign data
  useEffect(() => {
    if (loaded) {
      const foundCampaign = getCampaignById(id);
      if (foundCampaign) {
        setCampaign(foundCampaign);
      } else {
        // If campaign not found, navigate away.
        // This is necessary for initialization but won't be triggerable by user.
        router.push('/');
      }
    }
  }, [id, loaded, getCampaignById, router]);
  
  const goToNext = useCallback(() => {
    if (!campaign || campaign.media.length === 0) return;
    
    setCurrentIndex(prev => {
      const nextIndex = (prev + 1) % campaign.media.length;
      if (nextIndex === 0 && prev === campaign.media.length - 1) {
        setLoopTrigger(t => t + 1);
      }
      return nextIndex;
    });
  }, [campaign]);

  // Main playback logic effect
  useEffect(() => {
    if (!campaign || campaign.media.length === 0) {
      if (campaign && loaded) {
        // This navigation will be blocked by the popstate handler, but
        // it's a safe fallback in case of an empty campaign.
        router.push('/');
      }
      return;
    };
    
    const item = campaign.media[currentIndex];
    if (!item) return;

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
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [currentIndex, loopTrigger, campaign, goToNext, router, loaded]);
  
  if (!loaded || !campaign) {
    return <div className="bg-black flex items-center justify-center h-screen w-screen" />;
  }

  if (campaign.media.length === 0) {
    return (
        <div className="bg-black flex flex-col gap-4 items-center justify-center h-screen w-screen text-white">
            <p>This campaign has no media.</p>
        </div>
    );
  }

  return (
    <div onDoubleClick={(e) => e.preventDefault()} className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">
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
