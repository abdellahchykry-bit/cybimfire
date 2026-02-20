export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  duration: number; // in seconds. For images, this is the display duration. For videos, it's the file's length.
}

export interface Campaign {
  id: string;
  name: string;
  media: MediaItem[];
}

export type Orientation = 'landscape' | 'reverse-landscape' | 'portrait' | 'reverse-portrait';

export interface AppSettings {
  orientation: Orientation;
  autoStart: boolean;
  startOnBoot: boolean;
  lastPlayedCampaignId: string | null;
  defaultImageDuration: number;
}
