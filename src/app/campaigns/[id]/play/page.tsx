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
  
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loaded = campaignsLoaded && settingsLoaded;

  useEffect(() => {
    if (loaded) {
      const foundCampaign = getCampaignById(id);
      if (foundCampaign) {
        setCampaign(foundCampaign);
      } else {
        const timer = setTimeout(() => {
          const retryCampaign = getCampaignById(id);
          if (retryCampaign) {
            setCampaign(retryCampaign);
          } else {
            router.push('/');
          }
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [id, loaded, campaigns, getCampaignById, router]);
  
  const currentItem = campaign?.media[currentIndex];

  useEffect(() => {
    if (currentItem?.blob) {
        const objectUrl = URL.createObjectURL(currentItem.blob);
        setCurrentUrl(objectUrl);
        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    } else {
        setCurrentUrl(null);
    }
  }, [currentItem]);


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
    if (isExiting || !campaign || campaign.media.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % campaign.media.length);
  }, [campaign, isExiting]);

  // Main playback control effect
  useEffect(() => {
    if (!currentItem || !currentUrl || isExiting) {
      return;
    }
    
    // Always clear previous timeouts
    if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
    }

    if (currentItem.type === 'image') {
      timeoutRef.current = setTimeout(goToNext, currentItem.duration * 1000);
    } else if (currentItem.type === 'video') {
      const videoElement = videoRef.current;
      if (videoElement) {
        videoElement.play().catch(error => {
            console.error("Could not autoplay video, skipping.", error);
            goToNext(); 
        });
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentItem, currentUrl, goToNext, isExiting]);
  
  const handleVideoEnd = () => {
    goToNext();
  };
  
  if (!loaded || !campaign) {
    return (
        <div className="bg-black flex flex-col gap-4 items-center justify-center h-screen w-screen text-white" />
    );
  }

  if (campaign.media.length === 0) {
    return (
        <div className="bg-black flex flex-col gap-4 items-center justify-center h-screen w-screen text-white">
            <p>This campaign has no media.</p>
            <button onClick={() => router.push('/')} className="px-4 py-2 border rounded">Go Back</button>
        </div>
    );
  }

  const isSingleMediaCampaign = campaign.media.length === 1;

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">
      <div key={currentItem?.id} className="w-full h-full animate-fade-in">
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
            loop={isSingleMediaCampaign}
            onEnded={isSingleMediaCampaign ? undefined : handleVideoEnd}
            onError={() => goToNext()}
            className="w-full h-full object-cover"
            poster="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
            disableRemotePlayback
          />
        )}
      </div>
    </div>
  );
}
