"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowUp, ArrowDown, Trash2, Play, Image as ImageIcon, Video } from 'lucide-react';
import { useCampaigns } from '@/context/CampaignsContext';
import { useSettings } from '@/context/SettingsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { Campaign, MediaItem } from '@/lib/types';

const DURATION_OPTIONS = [5, 10, 15, 20, 30, 60];

export default function CampaignEditorPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { campaigns, getCampaignById, updateCampaign } = useCampaigns();
  const { settings } = useSettings();
  
  const campaign = getCampaignById(id);
  
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Redirect if campaign not found after campaigns load
    if (campaigns.length > 0 && !campaign) {
      router.push('/');
      return;
    }
    
    // Auto-select first media item
    if (campaign && campaign.media.length > 0 && !selectedMediaId) {
      setSelectedMediaId(campaign.media[0].id);
    }
    
    // If the selected media item no longer exists, update selection
    if (campaign && selectedMediaId && !campaign.media.find(m => m.id === selectedMediaId)) {
        setSelectedMediaId(campaign.media.length > 0 ? campaign.media[0].id : null)
    }

  }, [id, campaign, campaigns, router, selectedMediaId]);

  if (!campaign) {
    return <div className="flex items-center justify-center min-h-screen">Loading campaign...</div>;
  }
  
  const selectedMedia = campaign.media.find(m => m.id === selectedMediaId);

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
  
  const handleDurationChange = (duration: string) => {
    if (!selectedMediaId || !campaign) return;
    const newMedia = campaign.media.map(m => m.id === selectedMediaId ? { ...m, duration: parseInt(duration) } : m);
    const updatedCampaign = { ...campaign, media: newMedia };
    updateCampaign(updatedCampaign);
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = event.target.files?.[0];
    if (!file || !campaign) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const url = e.target?.result as string;

        if (type === 'image') {
            const newItem: MediaItem = {
                id: crypto.randomUUID(),
                type: 'image',
                url,
                duration: settings.defaultImageDuration,
            };
            const updatedCampaign = { ...campaign, media: [...campaign.media, newItem] };
            updateCampaign(updatedCampaign);
        } else { // video
            const videoElement = document.createElement('video');
            videoElement.preload = 'metadata';
            videoElement.onloadedmetadata = () => {
                const newItem: MediaItem = {
                    id: crypto.randomUUID(),
                    type: 'video',
                    url,
                    duration: videoElement.duration,
                };
                const updatedCampaign = { ...campaign, media: [...campaign.media, newItem] };
                updateCampaign(updatedCampaign);
            };
            videoElement.src = url;
        }
    };
    reader.readAsDataURL(file);
    
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
          <Button size="lg" className="h-12 text-lg">
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
                    {item.type === 'image' && <Image src={item.url} alt="thumbnail" layout="fill" objectFit="cover" unoptimized/>}
                    {item.type === 'video' && <div className="flex items-center justify-center h-full"><Video className="text-muted-foreground"/></div>}
                  </div>
                  <div className="flex-1 truncate">
                    <p className="font-medium">{`Item ${index + 1}`}</p>
                    <p className="text-sm text-muted-foreground truncate">{item.url.startsWith('data:') ? `Uploaded ${item.type}` : item.url}</p>
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
              <input type="file" ref={imageInputRef} onChange={(e) => handleFileSelect(e, 'image')} accept="image/*" style={{ display: 'none' }} />
              <input type="file" ref={videoInputRef} onChange={(e) => handleFileSelect(e, 'video')} accept="video/*" style={{ display: 'none' }} />
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => imageInputRef.current?.click()}><ImageIcon className="mr-2"/> Upload Image</Button>
                <Button className="flex-1" onClick={() => videoInputRef.current?.click()}><Video className="mr-2"/> Upload Video</Button>
              </div>
            </div>

            {selectedMedia && selectedMedia.type === 'image' && (
              <div className="space-y-3">
                <h3 className="font-semibold">Image Duration</h3>
                <RadioGroup value={String(selectedMedia.duration)} onValueChange={handleDurationChange} className="grid grid-cols-3 gap-2">
                  {DURATION_OPTIONS.map(d => (
                    <div key={d}>
                      <RadioGroupItem value={String(d)} id={`d-${d}`} className="peer sr-only" />
                      <Label htmlFor={`d-${d}`} className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                        {d}s
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}
             {selectedMedia && selectedMedia.type === 'video' && (
              <div className="text-muted-foreground p-4 border border-dashed rounded-md">
                Video duration is determined by the video file itself. ({selectedMedia.duration.toFixed(1)}s)
              </div>
            )}
            {!selectedMediaId && (
                <div className="text-muted-foreground p-4 border border-dashed rounded-md">
                  Select a media item from the playlist to edit its properties.
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
