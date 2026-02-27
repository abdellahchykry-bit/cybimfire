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
  const { loaded: settingsLoaded } = useSettings();
  
  const [campaign, setCampaign] = useState<Campaign | undefined>(undefined);
  const [currentIndex, setCurrentIndex] = useState(0);
  
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
            setCurrentUrl(null);
        };
    }
  }, [currentItem]);


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Back') {
        event.preventDefault();
        router.push('/');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);
  
  // Consolidated playback logic
  useEffect(() => {
    if (!currentItem || !currentUrl) {
      return;
    }

    const goToNext = () => {
      if (!campaign || campaign.media.length === 0) return;
      setCurrentIndex((prevIndex) => (prevIndex + 1) % campaign.media.length);
    };
    
    // Cleanup function
    const cleanup = () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        const videoElement = videoRef.current;
        if (videoElement) {
          videoElement.removeEventListener('ended', handleVideoEnd);
          videoElement.removeEventListener('error', handleVideoError);
        }
    };

    const handleVideoEnd = () => goToNext();
    const handleVideoError = () => {
      console.error("Video playback error, skipping.");
      goToNext();
    };

    if (currentItem.type === 'image') {
      cleanup();
      timeoutRef.current = setTimeout(goToNext, currentItem.duration * 1000);
    } else if (currentItem.type === 'video') {
      cleanup();
      const videoElement = videoRef.current;
      if (videoElement) {
        const isSingleMediaCampaign = campaign!.media.length === 1;
        videoElement.loop = isSingleMediaCampaign;
        
        if (!isSingleMediaCampaign) {
            videoElement.addEventListener('ended', handleVideoEnd);
        }
        videoElement.addEventListener('error', handleVideoError);

        videoElement.play().catch(handleVideoError);
      }
    }

    return cleanup;
  }, [currentItem, currentUrl, campaign]);
  
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

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">
      <div key={currentItem?.id} className="w-full h-full">
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
            autoPlay
            className="w-full h-full object-cover"
            disableRemotePlayback
          />
        )}
      </div>
    </div>
  );
}
