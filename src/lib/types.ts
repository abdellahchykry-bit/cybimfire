export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  duration: number; // in seconds, only for images
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
  lastPlayedCampaignId: string | null;
}
