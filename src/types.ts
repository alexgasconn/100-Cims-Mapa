export interface StravaActivity {
  id: string;
  name: string;
  type: string;
  date: string;
  distance: number;
  path: [number, number][]; // [longitude, latitude][]
}

export type ViewMode = 'polylines' | 'heatmap' | 'endpoints';

export const ACTIVITY_COLORS: Record<string, [number, number, number]> = {
  // Biking variants -> brown
  cycling: [150, 75, 0],
  Ride: [150, 75, 0],
  virtual_cycling: [150, 75, 0],
  VirtualRide: [150, 75, 0],
  e_biking: [150, 75, 0],
  EBikeRide: [150, 75, 0],
  mountain_biking: [150, 75, 0],
  MountainBikeRide: [150, 75, 0],
  gravel_cycling: [150, 75, 0],
  GravelRide: [150, 75, 0],

  // Running / walking / hiking -> orange
  running: [249, 115, 22],
  Run: [249, 115, 22],
  virtual_running: [249, 115, 22],
  VirtualRun: [249, 115, 22],
  walking: [249, 115, 22],
  Walk: [249, 115, 22],
  hiking: [249, 115, 22],
  Hike: [249, 115, 22],

  // Water sports -> cyan
  swimming: [6, 182, 212],
  Swim: [6, 182, 212],
  open_water_swimming: [6, 182, 212],
  OpenWaterSwim: [6, 182, 212],
  rowing: [6, 182, 212],
  Rowing: [6, 182, 212],
  kayaking: [6, 182, 212],
  Kayaking: [6, 182, 212],
  paddling: [6, 182, 212],
  Canoeing: [6, 182, 212],
  stand_up_paddleboarding: [6, 182, 212],
  StandUpPaddling: [6, 182, 212],
  surfing: [6, 182, 212],
  Surfing: [6, 182, 212],

  // Winter sports -> sky blue
  alpine_skiing: [96, 165, 250],
  AlpineSki: [96, 165, 250],
  cross_country_skiing: [96, 165, 250],
  BackcountrySki: [96, 165, 250],
  snowboarding: [96, 165, 250],
  Snowboard: [96, 165, 250],

  // Fallback for generic / unknown
  generic: [156, 163, 175],
  Other: [156, 163, 175],
};

export function getActivityColor(type: string): [number, number, number] {
  return ACTIVITY_COLORS[type] || ACTIVITY_COLORS.Other;
}

export interface Peak {
  id: string;
  url?: string;
  image?: string;
  name: string;
  height?: number;
  region?: string;
  essencial?: boolean;
  latitude: string | number;
  longitude: string | number;
}

// Fit parser types workaround
declare module 'fit-file-parser' {
  export default class FitParser {
    constructor(options: any);
    parse(buffer: ArrayBuffer | Uint8Array, callback: (error: Error | null, data: any) => void): void;
  }
}
