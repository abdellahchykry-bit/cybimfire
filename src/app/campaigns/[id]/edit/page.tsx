"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowUp, ArrowDown, Trash2, Play, Video, Upload } from 'lucide-react';
import { useCampaigns } from '@/context/CampaignsContext';
import { useSettings } from '@/context/SettingsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Campaign, MediaItem } from '@/lib/types';

const durationOptions = [5, 10, 15, 20, 30, 60];

export default function CampaignEditorPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { getCampaignById, updateCampaign, deleteCampaign, campaigns, loaded } = useCampaigns();
  const { settings } = useSettings();
  
  const [campaign, setCampaign] = useState<Campaign | undefined>(undefined);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const campaignRef = useRef(campaign);
  useEffect(() => {
    campaignRef.current = campaign;
  }, [campaign]);

  useEffect(() => {
    return () => {
      if (campaignRef.current && campaignRef.current.media.length === 0) {
        deleteCampaign(id);
      }
    };
  }, [id, deleteCampaign]);

  useEffect(() => {
    if (loaded) {
      const foundCampaign = getCampaignById(id);
      if (foundCampaign) {
        setCampaign(foundCampaign);
      } else {
        // If not found after context is loaded, it might be a new campaign that hasn't populated yet.
        // Wait a bit before deciding it's an invalid ID.
        const timer = setTimeout(() => {
          const retryCampaign = getCampaignById(id); // re-check
          if (!retryCampaign) {
            router.push('/');
          } else {
            setCampaign(retryCampaign);
          }
        }, 1000); // 1 sec should be enough
        return () => clearTimeout(timer);
      }
    }
  }, [id, loaded, campaigns, getCampaignById, router]);

  useEffect(() => {
    if (campaign) {
       if (campaign.media.length > 0 && !selectedMediaId) {
        setSelectedMediaId(campaign.media[0].id);
      }
      
      if (selectedMediaId && !campaign.media.find(m => m.id === selectedMediaId)) {
          setSelectedMediaId(campaign.media.length > 0 ? campaign.media[0].id : null)
      }
    }
  }, [campaign, selectedMediaId]);
  
  if (!loaded || !campaign) {
    return <div className="flex items-center justify-center min-h-screen">Loading campaign...</div>;
  }
  
  const selectedMedia = campaign.media.find(m => m.id === selectedMediaId);

  const handleUpdateMediaItem = (mediaId: string, updates: Partial<MediaItem>) => {
    if (!campaign) return;
    const newMedia = campaign.media.map(m => 
        m.id === mediaId ? { ...m, ...updates } : m
    );
    const updatedCampaign = { ...campaign, media: newMedia };
    setCampaign(updatedCampaign); // Update local state immediately for UI responsiveness
    updateCampaign(updatedCampaign);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (!campaign) return;
    const newMedia = [...campaign.media];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newMedia.length) return;
    [newMedia[index], newMedia[targetIndex]] = [newMedia[targetIndex], newMedia[index]];
    const updatedCampaign = { ...campaign, media: newMedia };
    updateCampaign(updatedCampaign);
  };

  const handleDelete = (mediaId: string) => {
    if (!campaign) return;
    const newMedia = campaign.media.filter(m => m.id !== mediaId);
    const updatedCampaign = { ...campaign, media: newMedia };
    updateCampaign(updatedCampaign);
  };
  
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !campaign) return;

    const newMediaPromises = Array.from(files).map(file => {
      return new Promise<MediaItem | null>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const url = e.target?.result as string;
          if (file.type.startsWith('image/')) {
            resolve({
              id: crypto.randomUUID(),
              type: 'image',
              url,
              duration: settings.defaultImageDuration,
            });
          } else if (file.type.startsWith('video/')) {
            const videoElement = document.createElement('video');
            videoElement.preload = 'metadata';
            videoElement.onloadedmetadata = () => {
              window.URL.revokeObjectURL(videoElement.src);
              resolve({
                id: crypto.randomUUID(),
                type: 'video',
                url,
                duration: videoElement.duration,
              });
            };
            videoElement.onerror = () => {
                window.URL.revokeObjectURL(videoElement.src);
                console.error("Error loading video metadata for file:", file.name);
                resolve(null)
            };
            videoElement.src = URL.createObjectURL(file);
          } else {
            resolve(null);
          }
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    });

    const results = await Promise.all(newMediaPromises);
    const newMediaItems = results.filter((item): item is MediaItem => item !== null);
    
    if (newMediaItems.length > 0) {
      const updatedCampaign = { ...campaign, media: [...campaign.media, ...newMediaItems] };
      await updateCampaign(updatedCampaign);
    }
    
    if(event.target) {
      event.target.value = '';
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-8">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Link href="/" passHref>
            <Button variant="outline" size="icon" className="h-12 w-12">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-headline text-primary">{campaign.name}</h1>
            <p className="text-muted-foreground">Campaign Editor</p>
          </div>
        </div>
        <Link href={`/campaigns/${campaign.id}/play`} passHref>
          <Button size="lg" className="h-12 text-lg" disabled={campaign.media.length === 0}>
            <Play className="mr-2 h-6 w-6" />
            Play
          </Button>
        </Link>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Media Playlist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {campaign.media.length === 0 && <p className="text-muted-foreground text-center py-8">No media items. Add some from the control panel.</p>}
              {campaign.media.map((item, index) => (
                <div key={item.id} 
                  tabIndex={0}
                  onFocus={() => setSelectedMediaId(item.id)}
                  onClick={() => setSelectedMediaId(item.id)}
                  className={`flex items-center gap-4 p-2 rounded-lg border-2 ${selectedMediaId === item.id ? 'border-primary' : 'border-transparent'} hover:bg-secondary/50 focus:bg-secondary/50 focus:outline-none`}>
                  <div className="w-24 h-16 bg-secondary rounded-md overflow-hidden relative flex-shrink-0">
                    {item.type === 'image' && <Image src={item.url} alt="thumbnail" fill style={{ objectFit: "cover" }} unoptimized/>}
                    {item.type === 'video' && <div className="flex items-center justify-center h-full"><Video className="text-muted-foreground"/></div>}
                  </div>
                  <div className="flex-1 truncate">
                    <p className="font-medium">{`Item ${index + 1}`}</p>
                    <p className="text-sm text-muted-foreground capitalize">{item.type}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" disabled={index === 0} onClick={() => handleMove(index, 'up')}><ArrowUp /></Button>
                    <Button variant="ghost" size="icon" disabled={index === campaign.media.length - 1} onClick={() => handleMove(index, 'down')}><ArrowDown /></Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(item.id)}><Trash2 /></Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h3 className="font-semibold">Add Media</h3>
              <input type="file" ref={mediaInputRef} onChange={handleFileSelect} accept="image/*,video/*" multiple style={{ display: 'none' }} />
              <Button className="w-full" onClick={() => mediaInputRef.current?.click()}><Upload className="mr-2"/> Upload Media</Button>
            </div>

            {selectedMedia?.type === 'image' && (
              <div className="space-y-4">
                <h3 className="font-semibold">Image Duration</h3>
                <div className="flex flex-wrap gap-2">
                  {durationOptions.map((duration) => (
                    <Button
                      key={duration}
                      variant={selectedMedia.duration === duration ? 'default' : 'outline'}
                      onClick={() => handleUpdateMediaItem(selectedMedia.id, { duration })}
                    >
                      {duration}s
                    </Button>
                  ))}
                </div>
              </div>
            )}
             {selectedMedia?.type === 'video' && (
              <div className="text-muted-foreground p-4 border border-dashed rounded-md">
                Video duration is determined by the video file itself. ({selectedMedia.duration.toFixed(1)}s)
              </div>
            )}
            {!selectedMediaId && (
                <div className="text-muted-foreground p-4 border border-dashed rounded-md">
                  Select a media item from the playlist to see its properties.
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
