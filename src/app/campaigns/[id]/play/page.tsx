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
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loaded = campaignsLoaded && settingsLoaded;

  useEffect(() => {
    if (loaded) {
      const foundCampaign = getCampaignById(id);
      if (foundCampaign) {
        setCampaign(foundCampaign);
      } else {
        // Retry logic for race condition on load
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
    if (!campaign || campaign.media.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % campaign.media.length);
  }, [campaign]);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!campaign || campaign.media.length === 0 || isExiting) return;

    const currentItem = campaign.media[currentIndex];

    if (currentItem.type === 'image') {
      timeoutRef.current = setTimeout(goToNext, currentItem.duration * 1000);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentIndex, campaign, isExiting, goToNext]);

  useEffect(() => {
    const currentItem = campaign?.media[currentIndex];
    if (currentItem?.type === 'video' && videoRef.current) {
        // Programmatically play the video to have more control and avoid unreliable autoplay behavior.
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error("Could not autoplay video, user interaction might be required.", error);
                goToNext(); // Skip to next if play fails
            });
        }
    }
  }, [campaign, currentIndex, goToNext]);
  
  const handleVideoEnd = () => {
    // This function is only for multi-item playlists. Single videos are handled by the `loop` attribute.
    goToNext();
  };
  
  if (!loaded || !campaign) {
    return (
        <div className="bg-black flex flex-col gap-4 items-center justify-center h-screen w-screen text-white" />
    );
  }
  
  const currentItem = campaign?.media[currentIndex];

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
      {currentItem?.type === 'image' && (
        <Image
          key={currentItem.id}
          src={currentItem.url}
          alt=""
          fill
          style={{ objectFit: 'cover' }}
          priority
          unoptimized
        />
      )}
      {currentItem?.type === 'video' && (
        <video
          key={currentItem.id}
          ref={videoRef}
          src={currentItem.url}
          // Removing `autoPlay` in favor of programmatic play in useEffect for reliability.
          playsInline
          muted
          // The `loop` attribute provides seamless looping for single-video campaigns, handled by the browser.
          loop={isSingleMediaCampaign}
          onEnded={isSingleMediaCampaign ? undefined : handleVideoEnd}
          onError={() => goToNext()}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
}
