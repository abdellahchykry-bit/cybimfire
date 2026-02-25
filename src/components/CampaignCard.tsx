"use client";

import Image from 'next/image';
import { Trash2, Pencil, Image as ImageIcon, Video } from 'lucide-react';
import type { Campaign } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

interface CampaignCardProps {
  campaign: Campaign;
  onEdit: () => void;
  onDelete: () => void;
}

export default function CampaignCard({ campaign, onEdit, onDelete }: CampaignCardProps) {
  const thumbnailItem = campaign.media.find(item => item.type === 'image') || campaign.media[0];
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  useEffect(() => {
    if (thumbnailItem?.blob) {
      const objectUrl = URL.createObjectURL(thumbnailItem.blob);
      setThumbnailUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [thumbnailItem]);


  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card's onClick from firing
    e.preventDefault();
    onDelete();
  };

  const handleEdit = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent card's onClick from firing
      e.preventDefault();
      onEdit();
  }

  return (
      <Card 
        role="group"
        className="flex flex-col h-full overflow-hidden transition-all duration-200 border-2 border-transparent focus-within:border-primary hover:border-primary/50"
      >
        <CardHeader 
          onClick={handleEdit}
          className="p-0 cursor-pointer focus:outline-none focus:ring-4 focus:ring-primary/50 rounded-t-lg"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onEdit()}}
        >
          <div className="relative aspect-video w-full bg-secondary">
            {thumbnailUrl && thumbnailItem.type === 'image' ? (
              <Image
                src={thumbnailUrl}
                alt={campaign.name}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                 {thumbnailItem?.type === 'video' 
                    ? <Video className="w-12 h-12 text-muted-foreground" />
                    : <ImageIcon className="w-12 h-12 text-muted-foreground" />
                 }
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-1">
          <CardTitle className="text-lg font-headline break-words">{campaign.name}</CardTitle>
        </CardContent>
        <CardFooter className="p-2 pt-0 mt-auto flex justify-end gap-2">
           <Button variant="outline" size="icon" onClick={handleEdit}>
            <Pencil />
            <span className="sr-only">Edit {campaign.name}</span>
          </Button>
          <Button variant="destructive" size="icon" onClick={handleDelete}>
            <Trash2 />
            <span className="sr-only">Delete {campaign.name}</span>
          </Button>
        </CardFooter>
      </Card>
  );
}
