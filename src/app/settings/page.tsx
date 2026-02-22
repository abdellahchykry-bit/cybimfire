"use client";

import Link from 'next/link';
import { ArrowLeft, Power, ScreenShare } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import type { Orientation } from '@/lib/types';

const orientationOptions: { value: Orientation; label: string; icon: React.ElementType }[] = [
  { value: 'landscape', label: 'Landscape', icon: ScreenShare },
  { value: 'reverse-landscape', label: 'Reverse Landscape', icon: ScreenShare },
  { value: 'portrait', label: 'Portrait', icon: ScreenShare },
  { value: 'reverse-portrait', label: 'Reverse Portrait', icon: ScreenShare },
];

const durationOptions = [5, 10, 15, 20, 30, 60];

export default function SettingsPage() {
  const { settings, updateSettings, loaded } = useSettings();

  if (!loaded) {
    return <div className="flex items-center justify-center min-h-screen">Loading settings...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-3xl font-headline">Settings</CardTitle>
            <Link href="/" passHref>
              <Button variant="outline" size="icon" className='h-12 w-12'>
                <ArrowLeft className="h-6 w-6" />
                <span className="sr-only">Back to Home</span>
              </Button>
            </Link>
          </div>
          <CardDescription>
            Manage your signage player settings. Changes are saved automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-12 pt-8">
          <div className="space-y-4">
            <h3 className="text-xl font-headline">Screen Orientation</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {orientationOptions.map((opt, i) => {
                const Icon = i === 1 ? (props: any) => <ScreenShare {...props} style={{ transform: 'rotate(180deg)'}}/> : i === 2 ? (props: any) => <ScreenShare {...props} style={{ transform: 'rotate(90deg)'}}/> : i === 3 ? (props: any) => <ScreenShare {...props} style={{ transform: 'rotate(-90deg)'}}/> : opt.icon;
                return (
                <Button
                  key={opt.value}
                  variant={settings.orientation === opt.value ? 'default' : 'outline'}
                  className="h-24 text-lg flex-col gap-2"
                  onClick={() => updateSettings({ orientation: opt.value })}
                >
                  <Icon className="h-8 w-8" />
                  {opt.label}
                </Button>
              )})}
            </div>
          </div>
           <div className="space-y-4">
            <h3 className="text-xl font-headline">Default Image Duration</h3>
            <div className="rounded-md border p-6">
                <p className="text-sm text-muted-foreground mb-4">
                Set the default display duration for newly added images.
                </p>
                <div className="flex flex-wrap gap-2">
                {durationOptions.map((duration) => (
                  <Button
                    key={duration}
                    variant={settings.defaultImageDuration === duration ? 'default' : 'outline'}
                    onClick={() => updateSettings({ defaultImageDuration: duration })}
                  >
                    {duration}s
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-headline">Auto Start</h3>
            <div className="flex items-center space-x-4 rounded-md border p-4">
              <Power className="w-6 h-6 text-muted-foreground" />
              <div className="flex-1 space-y-1">
                <p className="text-lg font-medium">
                  Auto Start on Launch
                </p>
                <p className="text-sm text-muted-foreground">
                  If enabled, the last played campaign will start automatically when the app opens.
                </p>
              </div>
              <Switch
                id="auto-start"
                checked={settings.autoStart}
                onCheckedChange={(checked) => updateSettings({ autoStart: checked })}
                aria-label="Toggle auto start"
              />
            </div>
            <div className="flex items-center space-x-4 rounded-md border p-4">
              <Power className="w-6 h-6 text-muted-foreground" />
              <div className="flex-1 space-y-1">
                <p className="text-lg font-medium">
                  Start on Boot (Boot Receiver)
                </p>
                <p className="text-sm text-muted-foreground">
                  If enabled, the app will attempt to launch on system startup. (Requires device support)
                </p>
              </div>
              <Switch
                id="start-on-boot"
                checked={settings.startOnBoot}
                onCheckedChange={(checked) => updateSettings({ startOnBoot: checked })}
                aria-label="Toggle start on boot"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
