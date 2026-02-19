"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Play, Trash2, Image as ImageIcon } from 'lucide-react';
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

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    // Consider adding a confirmation dialog here
    deleteCampaign(campaign.id);
  };
  
  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    router.push(`/campaigns/${campaign.id}/play`);
  };

  return (
    <Link href={`/campaigns/${campaign.id}/edit`} passHref>
      <Card className="flex flex-col h-full overflow-hidden transition-all duration-200 hover:border-primary focus-within:border-primary">
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
          <CardTitle className="text-lg font-headline truncate">{campaign.name}</CardTitle>
        </CardContent>
        <CardFooter className="p-2 pt-0 flex justify-between">
          <Button variant="ghost" size="icon" onClick={handlePlay}>
              <Play />
              <span className="sr-only">Play {campaign.name}</span>
          </Button>
          <Button variant="destructive" size="icon" onClick={handleDelete}>
            <Trash2 />
            <span className="sr-only">Delete {campaign.name}</span>
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
