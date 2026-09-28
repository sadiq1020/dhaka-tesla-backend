export interface Zone {
  name: string;
  lat: number;
  lng: number;
}

export const ZONES = {
  banani: { name: 'Banani', lat: 23.7937, lng: 90.4066 },
  mohakhali: { name: 'Mohakhali', lat: 23.7776, lng: 90.4050 },
  'gulshan-1': { name: 'Gulshan 1', lat: 23.7806, lng: 90.4166 },
  'gulshan-2': { name: 'Gulshan 2', lat: 23.7925, lng: 90.4148 },
  badda: { name: 'Badda', lat: 23.7806, lng: 90.4258 },
  rampura: { name: 'Rampura', lat: 23.7616, lng: 90.4265 },
  bashundhara: { name: 'Bashundhara', lat: 23.8193, lng: 90.4526 },
  uttara: { name: 'Uttara', lat: 23.8759, lng: 90.3795 },
  farmgate: { name: 'Farmgate', lat: 23.7576, lng: 90.3897 },
  dhanmondi: { name: 'Dhanmondi', lat: 23.7461, lng: 90.3742 },
  mirpur: { name: 'Mirpur', lat: 23.8069, lng: 90.3687 },
} as const;

export type ZoneSlug = keyof typeof ZONES;

export const isValidZone = (zone: string): zone is ZoneSlug => {
  return zone in ZONES;
};

// A corridor = zones a Tesla can pass through on one trip
export const CORRIDORS: ZoneSlug[][] = [
  ['banani', 'mohakhali', 'gulshan-1', 'gulshan-2', 'badda', 'rampura'],
  ['banani', 'gulshan-2', 'bashundhara'],
  ['mohakhali', 'banani', 'uttara'],
  ['banani', 'mohakhali', 'farmgate', 'dhanmondi'],
  ['banani', 'mohakhali', 'farmgate', 'mirpur'],
];

/**
 * Matching rule: Two destinations can pool together from a pickup zone if:
 * 1. They have identical destinations, OR
 * 2. There exists a predefined corridor containing the pickup zone and both destinations.
 */
export const areRoutesCompatible = (
  pickup: ZoneSlug,
  destinationA: ZoneSlug,
  destinationB: ZoneSlug,
): boolean => {
  if (destinationA === destinationB) return true;
  return CORRIDORS.some(
    (corridor) =>
      corridor.includes(pickup) &&
      corridor.includes(destinationA) &&
      corridor.includes(destinationB),
  );
};
