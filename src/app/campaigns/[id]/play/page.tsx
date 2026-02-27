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
        
        // If this was the startup campaign, disable auto-start
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
    if (!currentItem || !currentUrl || !campaign) {
      return;
    }

    const goToNext = () => {
      if (campaign.media.length > 0) {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % campaign.media.length);
      }
    };

    if (currentItem.type === 'image') {
      const timer = setTimeout(goToNext, currentItem.duration * 1000);
      return () => clearTimeout(timer); // Cleanup for image timer
    }

    if (currentItem.type === 'video') {
      const videoElement = videoRef.current;
      if (!videoElement) return;

      const isSingleMediaCampaign = campaign.media.length === 1;
      videoElement.loop = isSingleMediaCampaign;

      const handleVideoEnd = () => goToNext();
      const handleVideoError = () => {
        console.error("Video playback error, skipping.");
        goToNext();
      };
      
      const playVideo = () => {
        if (!videoElement) return;
        
        // Explicitly mute before playing for maximum compatibility.
        videoElement.muted = true;
        
        try {
            const playPromise = videoElement.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error("Video autoplay promise failed, skipping.", error);
                    handleVideoError();
                });
            }
        } catch (error) {
            console.error("Video autoplay threw an error, skipping.", error);
            handleVideoError();
        }
      };

      // Add listeners
      if (!isSingleMediaCampaign) {
        videoElement.addEventListener('ended', handleVideoEnd);
      }
      videoElement.addEventListener('error', handleVideoError);
      
      // Attempt to play only when the video is ready
      if (videoElement.readyState >= 4) { // HAVE_ENOUGH_DATA
        playVideo();
      } else {
        videoElement.addEventListener('canplaythrough', playVideo, { once: true });
      }

      // Cleanup for video listeners
      return () => {
        videoElement.removeEventListener('ended', handleVideoEnd);
        videoElement.removeEventListener('error', handleVideoError);
      };
    }
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
