"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Settings, Play, Info, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
          <CybimLogo className="h-10 w-10" />
          <h1 className="text-3xl font-headline text-primary">CYBIM</h1>
        </div>
        <div className="flex items-center gap-4">
          <Clock />
          <div className="flex items-center">
            <Link href="/settings" passHref>
              <Button variant="ghost" size="icon" className="w-12 h-12">
                <Settings className="w-7 h-7" />
              </Button>
            </Link>
            <Link href="/about" passHref>
              <Button variant="ghost" size="icon" className="w-12 h-12">
                <Info className="w-7 h-7" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <div className="mb-8">
          <h2 className="text-4xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Manage your digital signage campaigns</p>
        </div>

        <div className="flex gap-4 mb-12">
           <Button size="lg" className="h-12 text-base" onClick={handleAddCampaign}>
            <Plus className="mr-2 h-5 w-5" />
            Create Campaign
          </Button>
          <Link href={playTargetId ? `/campaigns/${playTargetId}/play` : '#'} passHref>
            <Button
              variant="outline"
              size="lg"
              className="h-12 text-base"
              disabled={!playTargetId}
            >
              <Play className="mr-2 h-5 w-5" />
              Play Campaigns
            </Button>
          </Link>
        </div>

        {isClient && campaigns.length > 0 && (
          <div className="w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {campaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          </div>
        )}
        
        {isClient && campaigns.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center rounded-lg border border-dashed py-12">
             <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
                <Film className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold mb-2">No Campaigns Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-xs mx-auto">
              Create your first campaign to start displaying content on your digital signage.
            </p>
            <Button onClick={handleAddCampaign}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Campaign
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
