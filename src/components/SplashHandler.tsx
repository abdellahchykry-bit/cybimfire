"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SplashScreen from '@/components/SplashScreen';
import { useSettings } from '@/context/SettingsContext';
import { useCampaigns } from '@/context/CampaignsContext';

export default function SplashHandler({ children }: { children: React.ReactNode }) {
    const [isReady, setIsReady] = useState(false);
    const { settings, loaded: settingsLoaded } = useSettings();
    const { loaded: campaignsLoaded } = useCampaigns();
    const router = useRouter();
    const startupAttempted = useRef(false);

    useEffect(() => {
        const dataLoaded = settingsLoaded && campaignsLoaded;
        if (!dataLoaded || startupAttempted.current) return;

        startupAttempted.current = true;

        const timer = setTimeout(() => {
            if (settings.startupCampaignId) {
                router.replace(`/campaigns/${settings.startupCampaignId}/play`);
            } else {
                setIsReady(true);
            }
        }, 2000); // Wait 2 seconds before deciding what to do

        return () => clearTimeout(timer);

    }, [settingsLoaded, campaignsLoaded, settings, router]);

    return isReady ? <>{children}</> : <SplashScreen />;
}
