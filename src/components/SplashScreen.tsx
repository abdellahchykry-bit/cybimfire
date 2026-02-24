import CybimLogo from '@/components/icons/CybimLogo';

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-[#0A0A0A] flex items-center justify-center z-50">
        <div className="flex flex-col items-center justify-center gap-4 animate-in fade-in duration-1000">
            <div className="flex items-center gap-6">
            <CybimLogo className="w-24 h-24" />
            <div>
                <h1 className="text-5xl font-headline text-white tracking-wider">CYBIM</h1>
                <p className="text-lg text-muted-foreground/80 mt-1">Offline Signage Player</p>
            </div>
            </div>
        </div>
    </div>
  );
}
