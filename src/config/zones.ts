import { z } from 'zod';

export interface Zone {
  name: string;
  lat: number;
  lng: number;
}

/**
 * All predefined Dhaka zones for the MVP.
 * Coordinates are approximate and used for Haversine distance calculation.
 * No Google Maps API is called at runtime — coordinates live entirely in this file.
 */
export const ZONES = {
  banani: { name: 'Banani', lat: 23.7937, lng: 90.4066 },
  mohakhali: { name: 'Mohakhali', lat: 23.7776, lng: 90.405 },
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

/**
 * Zod schema for validating zone slugs.
 * Built dynamically from the ZONES object so adding a new zone only requires
 * one change in this file — the validator updates automatically.
 */
export const zoneSlugSchema = z.enum(
  Object.keys(ZONES) as [ZoneSlug, ...ZoneSlug[]],
);

export const isValidZone = (zone: string): zone is ZoneSlug => {
  return zone in ZONES;
};

/**
 * CORRIDORS define which zones can be served on a single Tesla trip.
 *
 * Matching rule: two requests can share a pool if
 *  1. Their pickup zones are identical, AND
 *  2. All their destinations appear in at least one corridor that also
 *     contains the pickup zone.
 *
 * The list is NOT direction-aware (intentional MVP simplification).
 * Document this in the README.
 */
export const CORRIDORS: ZoneSlug[][] = [
  // Corridor 1 – Banani / Gulshan spine heading east
  ['banani', 'mohakhali', 'gulshan-1', 'gulshan-2', 'badda', 'rampura'],
  // Corridor 2 – Banani north-east toward Bashundhara
  ['banani', 'gulshan-2', 'bashundhara'],
  // Corridor 3 – Mohakhali north toward Uttara
  ['mohakhali', 'banani', 'uttara'],
  // Corridor 4 – Banani south-west toward Farmgate / Dhanmondi
  ['banani', 'mohakhali', 'farmgate', 'dhanmondi'],
  // Corridor 5 – Banani south-west toward Farmgate / Mirpur
  ['banani', 'mohakhali', 'farmgate', 'mirpur'],
];

/**
 * Returns a list of all zones suitable for frontend dropdowns.
 * The frontend must NEVER hardcode zone names; it calls GET /api/zones instead.
 */
export const getZoneList = (): Array<{ slug: ZoneSlug; name: string }> =>
  (Object.keys(ZONES) as ZoneSlug[]).map((slug) => ({
    slug,
    name: ZONES[slug].name,
  }));
