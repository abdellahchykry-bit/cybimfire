"use client";

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Trash2, Pencil, Image as ImageIcon } from 'lucide-react';
import type { Campaign } from '@/lib/types';
import { useCampaigns } from '@/context/CampaignsContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CampaignCardProps {
  campaign: Campaign;
}

export default function CampaignCard({ campaign }: CampaignCardProps) {
  const router = useRouter();
  const { deleteCampaign } = useCampaigns();
  const thumbnail = campaign.media.find(item => item.type === 'image')?.url || campaign.media[0]?.url;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    // Consider adding a confirmation dialog here
    await deleteCampaign(campaign.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      router.push(`/campaigns/${campaign.id}/edit`);
  }

  const handleCardClick = () => {
    router.push(`/campaigns/${campaign.id}/edit`);
  }

  const handleCardKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      router.push(`/campaigns/${campaign.id}/edit`);
    }
  }

  return (
      <Card 
        role="group"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={handleCardKeyDown}
        className="flex flex-col h-full cursor-pointer overflow-hidden transition-all duration-200 hover:border-primary focus-within:border-primary focus:outline-none focus:ring-4 focus:ring-primary/50"
      >
        <CardHeader className="p-0">
          <div className="relative aspect-video w-full bg-secondary">
            {thumbnail ? (
              <Image
                src={thumbnail}
                alt={campaign.name}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <ImageIcon className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-1">
          <CardTitle className="text-lg font-headline">{campaign.name}</CardTitle>
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
