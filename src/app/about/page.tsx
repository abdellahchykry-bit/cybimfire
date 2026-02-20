"use client";

import Link from 'next/link';
import { ArrowLeft, Monitor, Cog, Film, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CybimLogo from '@/components/icons/CybimLogo';

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen p-8 lg:p-12">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <CybimLogo className="h-12 w-12 text-primary" />
          <h1 className="text-4xl font-headline text-primary">CYBIM</h1>
        </div>
        <Link href="/" passHref>
          <Button variant="outline" size="icon" className="h-12 w-12">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-4xl">
          <section className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary mb-4">What is CYBIM?</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              CYBIM is a professional digital signage player for businesses, retail
              stores, restaurants, and public displays. It enables you to create and
              manage multimedia campaigns locally and transforms any standard
              Android TV into a powerful, professional signage solution.
            </p>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <Card>
              <CardHeader className="items-center">
                <div className="p-4 bg-primary/10 rounded-full mb-2">
                  <Monitor className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Offline Operation</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                <p>Works completely offline - no internet required after setup.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="items-center">
                <div className="p-4 bg-primary/10 rounded-full mb-2">
                  <Cog className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Easy Scheduling</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                <p>Schedule campaigns to run at specific times and days.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="items-center">
                <div className="p-4 bg-primary/10 rounded-full mb-2">
                  <Film className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Media Support</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                <p>Supports images and videos with smooth transitions.</p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h3 className="text-2xl font-bold text-center mb-6">Features</h3>
            <ul className="space-y-4 max-w-md mx-auto">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <span className="text-lg">Create and manage multiple campaigns</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <span className="text-lg">Upload images and videos (up to 10MB each)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <span className="text-lg">Set custom durations for images (5s, 10s, 15s, 20s, 30s, 60s)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <span className="text-lg">Schedule campaigns to run at specific times</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <span className="text-lg">Multiple screen orientations supported</span>
              </li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
