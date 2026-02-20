"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Settings, Play, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import CybimLogo from '@/components/icons/CybimLogo';
import Clock from '@/components/Clock';
import CampaignCard from '@/components/CampaignCard';
import { useCampaigns } from '@/context/CampaignsContext';
import { useSettings } from '@/context/SettingsContext';
import { useEffect, useState } from 'react';

export default function Home() {
  const router = useRouter();
  const { campaigns, addCampaign } = useCampaigns();
  const { settings } = useSettings();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleAddCampaign = () => {
    const newCampaign = addCampaign();
    router.push(`/campaigns/${newCampaign.id}/edit`);
  };

  const playTargetId = settings.lastPlayedCampaignId ?? campaigns[0]?.id;

  return (
    <div className="flex flex-col min-h-screen p-8 lg:p-12">
      <header className="flex justify-between items-start mb-12">
        <div className="flex items-center gap-4">
          <CybimLogo className="h-12 w-12" />
          <div>
            <h1 className="text-4xl font-headline text-primary">CYBIM</h1>
            <p className="text-lg text-foreground">Offline Signage Player</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock />
          <Link href="/about" passHref>
            <Button variant="ghost" size="icon" className="w-12 h-12">
              <Info className="w-7 h-7" />
            </Button>
          </Link>
          <Link href="/settings" passHref>
            <Button variant="ghost" size="icon" className="w-12 h-12">
              <Settings className="w-7 h-7" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center">
        <div className="flex gap-8 mb-16">
          <Link href={playTargetId ? `/campaigns/${playTargetId}/play` : '#'} passHref>
            <Button
              size="lg"
              className="h-32 w-72 text-2xl font-headline flex-col gap-2"
              disabled={!playTargetId || campaigns.length === 0}
            >
              <Play className="h-10 w-10" />
              Play Campaign
            </Button>
          </Link>
          <Button
            size="lg"
            className="h-32 w-72 text-2xl font-headline flex-col gap-2"
            onClick={handleAddCampaign}
          >
            <Plus className="h-10 w-10" />
            Add Campaign
          </Button>
        </div>

        {isClient && campaigns.length > 0 && (
          <div className="w-full">
            <h2 className="text-2xl font-headline mb-4">Your Campaigns</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {campaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          </div>
        )}
        {isClient && campaigns.length === 0 && (
           <Card className="p-12 text-center text-muted-foreground">
             <p>No campaigns yet. Click 'Add Campaign' to get started.</p>
           </Card>
        )}
      </main>
    </div>
  );
}
