"use client";

import { useState, useEffect } from 'react';
import SplashScreen from '@/components/SplashScreen';
import { useSettings } from '@/context/SettingsContext';
import { useCampaigns } from '@/context/CampaignsContext';

export default function SplashHandler({ children }: { children: React.ReactNode }) {
    const [isReady, setIsReady] = useState(false);
    const { loaded: settingsLoaded } = useSettings();
    const { loaded: campaignsLoaded } = useCampaigns();

    useEffect(() => {
        const dataLoaded = settingsLoaded && campaignsLoaded;
        if (!dataLoaded) return;

        const timer = setTimeout(() => {
            setIsReady(true);
        }, 2000); // Always wait 2 seconds before showing the main app

        return () => clearTimeout(timer);

    }, [settingsLoaded, campaignsLoaded]);

    return isReady ? <>{children}</> : <SplashScreen />;
}
