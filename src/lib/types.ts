export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  blob: Blob;
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
  lastPlayedCampaignId: string | null;
  defaultImageDuration: number;
  startOnBoot: boolean;
}
