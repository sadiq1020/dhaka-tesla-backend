import { CORRIDORS, type ZoneSlug } from '../../config/zones.js';

/**
 * Determines whether a set of destinations can all share a single Tesla trip
 * from the same pickup zone.
 *
 * Rules:
 *  - If all destinations are identical → always poolable (trivial match).
 *  - Otherwise, there must exist at least one corridor that:
 *      a) contains the pickup zone, AND
 *      b) contains EVERY destination in the list.
 *
 * Note: "same pickup zone" is enforced at the call site
 * (pool.pickupZone === rideRequest.pickupZone).
 * This function only checks corridor compatibility.
 *
 * The function takes a list (not just two) because a full pool can have
 * up to 3 passengers, each with a different destination.
 */
export function canPool(pickup: ZoneSlug, destinations: ZoneSlug[]): boolean {
  const unique = [...new Set(destinations)];

  // Single unique destination — everyone is going to the same place
  if (unique.length <= 1) return true;

  // All destinations must appear in at least one shared corridor
  return CORRIDORS.some(
    (corridor) =>
      corridor.includes(pickup) && unique.every((dest) => corridor.includes(dest)),
  );
}
