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
  Ride: [150, 75, 0],
  VirtualRide: [150, 75, 0],
  EBikeRide: [150, 75, 0],
  MountainBikeRide: [150, 75, 0],
  GravelRide: [150, 75, 0],
  // Running / walking / hiking -> orange
  Run: [249, 115, 22],
  VirtualRun: [249, 115, 22],
  Walk: [249, 115, 22],
  Hike: [249, 115, 22],
  // Swimming / aquatic -> cyan
  Swim: [6, 182, 212],
  OpenWaterSwim: [6, 182, 212],
  Rowing: [6, 182, 212],
  Kayaking: [6, 182, 212],
  // Ski / snow sports and other misc -> sky blue
  Ski: [96, 165, 250],
  BackcountrySki: [96, 165, 250],
  AlpineSki: [96, 165, 250],
  Snowboard: [96, 165, 250],
  // Fallback for unknown
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
