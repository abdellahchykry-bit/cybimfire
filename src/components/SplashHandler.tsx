"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SplashScreen from '@/components/SplashScreen';
import { useSettings } from '@/context/SettingsContext';
import { useCampaigns } from '@/context/CampaignsContext';

export default function SplashHandler({ children }: { children: React.ReactNode }) {
    const [isReady, setIsReady] = useState(false);
    const { settings, loaded: settingsLoaded } = useSettings();
    const { campaigns, loaded: campaignsLoaded } = useCampaigns();
    const router = useRouter();

    useEffect(() => {
        const dataLoaded = settingsLoaded && campaignsLoaded;
        if (!dataLoaded) return;

        const timer = setTimeout(() => {
            const { startupCampaignId } = settings;
            const startupCampaignExists = campaigns.some(c => c.id === startupCampaignId);

            if (startupCampaignId && startupCampaignExists) {
                router.replace(`/campaigns/${startupCampaignId}/play`);
            } else {
                setIsReady(true);
            }
        }, 2000); // Wait 2 seconds before deciding what to do

        return () => clearTimeout(timer);

    }, [settingsLoaded, campaignsLoaded, settings, campaigns, router]);

    return isReady ? <>{children}</> : <SplashScreen />;
}
