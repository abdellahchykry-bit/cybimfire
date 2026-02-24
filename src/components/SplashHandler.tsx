"use client";

import { useState, useEffect } from 'react';
import SplashScreen from '@/components/SplashScreen';

export default function SplashHandler({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        const timer = setTimeout(() => {
            setLoading(false);
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    if (!isClient) {
        return null;
    }

    return loading ? <SplashScreen /> : <>{children}</>;
}
