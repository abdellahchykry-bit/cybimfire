"use client";

import Link from 'next/link';
import { ArrowLeft, RotateCcw, RotateCw, ScreenShare, ToggleLeft, ToggleRight } from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { Orientation } from '@/lib/types';

const orientationOptions: { value: Orientation; label: string; icon: React.ElementType }[] = [
  { value: 'landscape', label: 'Landscape', icon: ScreenShare },
  { value: 'reverse-landscape', label: 'Reverse Landscape', icon: ScreenShare },
  { value: 'portrait', label: 'Portrait', icon: ScreenShare },
  { value: 'reverse-portrait', label: 'Reverse Portrait', icon: ScreenShare },
];

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();

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
                const Icon = i === 1 ? (props: any) => <ScreenShare {...props} style={{ transform: 'scaleX(-1)'}}/> : i === 2 ? (props: any) => <ScreenShare {...props} style={{ transform: 'rotate(90deg)'}}/> : i === 3 ? (props: any) => <ScreenShare {...props} style={{ transform: 'rotate(-90deg) scaleY(-1)'}}/> : opt.icon;
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
            <h3 className="text-xl font-headline">Auto Start</h3>
            <div className="flex items-center space-x-4 rounded-md border p-4">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
