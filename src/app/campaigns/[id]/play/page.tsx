"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { useCampaigns } from '@/hooks/use-campaigns';
import { useSettings } from '@/hooks/use-settings';
import { cn } from '@/lib/utils';
import type { Campaign } from '@/lib/types';

export default function PlayPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { getCampaignById } = useCampaigns();
  const { settings, updateSettings } = useSettings();
  const [campaign, setCampaign] = useState<Campaign | undefined>(undefined);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setCampaign(getCampaignById(id));
    updateSettings({ lastPlayedCampaignId: id });
  }, [id, getCampaignById, updateSettings]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsExiting(true);
        router.back();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);
  
  const goToNext = () => {
    if (!campaign || campaign.media.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % campaign.media.length);
  };

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
  }, [currentIndex, campaign, isExiting]);
  
  const handleVideoEnd = () => {
    goToNext();
  };
  
  const currentItem = campaign?.media[currentIndex];

  const orientationClasses = {
    'landscape': 'rotate-0',
    'reverse-landscape': 'rotate-180',
    'portrait': 'rotate-90',
    'reverse-portrait': 'rotate-[-90deg]',
  };
  
  if (!campaign) {
    return <div className="bg-black flex items-center justify-center h-screen w-screen text-white">Loading...</div>;
  }
  
  if (campaign.media.length === 0) {
    return (
        <div className="bg-black flex flex-col gap-4 items-center justify-center h-screen w-screen text-white">
            <p>This campaign has no media.</p>
            <button onClick={() => router.back()} className="px-4 py-2 border rounded">Go Back</button>
        </div>
    );
  }

  return (
    <div className={cn("fixed inset-0 bg-black flex items-center justify-center overflow-hidden", orientationClasses[settings.orientation] || 'rotate-0')}>
      {currentItem?.type === 'image' && (
        <Image
          key={currentItem.id}
          src={currentItem.url}
          alt=""
          layout="fill"
          objectFit="contain"
          priority
          unoptimized
        />
      )}
      {currentItem?.type === 'video' && (
        <video
          key={currentItem.id}
          ref={videoRef}
          src={currentItem.url}
          autoPlay
          muted
          onEnded={handleVideoEnd}
          className="w-full h-full object-contain"
        />
      )}
    </div>
  );
}
