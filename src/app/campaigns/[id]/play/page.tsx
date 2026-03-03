"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
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
    if (!campaign || !campaigns || campaigns.length === 0) return;
  
    const isLastItem = currentIndex === campaign.media.length - 1;
  
    if (isLastItem) {
      if (settings.autoplayAll) {
        const currentCampaignIndex = campaigns.findIndex(c => c.id === id);
        if (currentCampaignIndex === -1) {
          // Should not happen, but as a fallback, loop the current campaign
          setCurrentIndex(0);
          if (campaign.media.length === 1) {
            setLoopTrigger(t => t + 1);
          }
          return;
        }
        const nextCampaignIndex = (currentCampaignIndex + 1) % campaigns.length;
        const nextCampaign = campaigns[nextCampaignIndex];
        router.push(`/campaigns/${nextCampaign.id}/play`);
      } else {
        // Loop current campaign
        if (currentIndex === 0) { // Single-item campaign needs a forced re-render
            setLoopTrigger(t => t + 1);
        } else {
            setCurrentIndex(0);
        }
      }
    } else {
      // Go to next item in the same campaign
      setCurrentIndex(prev => prev + 1);
    }
  }, [campaign, campaigns, currentIndex, id, router, settings.autoplayAll]);

  
  // Consolidated playback logic
  useEffect(() => {
    if (!currentItem || !campaign || !currentUrl) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const videoElement = videoRef.current;
    let playVideo: () => void;

    if (videoElement) {
        videoElement.onended = null;
        videoElement.onerror = null;
        videoElement.removeEventListener('canplaythrough', playVideo);
    }

    if (currentItem.type === 'image') {
      timeoutRef.current = setTimeout(goToNext, settings.defaultImageDuration * 1000);
    }

    if (currentItem.type === 'video' && videoElement) {
      videoElement.loop = false;
      
      const handleVideoEnd = () => {
        goToNext();
      };
      
      const handleVideoError = () => {
        goToNext();
      };
      
      playVideo = () => {
        videoElement.muted = true;
        const playPromise = videoElement.play();
        if (playPromise !== undefined) {
          playPromise.catch(handleVideoError);
        }
      };

      videoElement.addEventListener('canplaythrough', playVideo, { once: true });
      videoElement.onended = handleVideoEnd;
      videoElement.onerror = handleVideoError;
      
      videoElement.load();
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (videoElement && playVideo) {
        videoElement.removeEventListener('canplaythrough', playVideo);
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
              display: currentItem?.type === 'image' ? 'block' : 'none' 
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
            className="w-full h-full object-cover"
            style={{ display: currentItem?.type === 'video' ? 'block' : 'none' }}
            disableRemotePlayback
        />
      </div>
    </div>
  );
}
