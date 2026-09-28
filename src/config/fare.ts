import { ZONES, type ZoneSlug } from './zones.js';

export const FARE_CONFIG = {
  BASE_FARE_PAISA: 2000, // ৳20.00 base fare
  PER_KM_PAISA: 1500, // ৳15.00 per km
  ROAD_FACTOR: 1.3, // Road distance factor over straight line
  DISCOUNT_PERCENT: {
    1: 0, // Solo rider: 0% discount
    2: 15, // 2 pool riders: 15% discount
    3: 25, // 3 pool riders: 25% discount
  } as Record<number, number>,
};

/**
 * Calculates straight line distance between two coordinates in kilometers using Haversine formula
 */
export const calculateStraightLineDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Calculates estimated road distance between two zones, rounded to the nearest 100 meters (0.1 km)
 */
export const calculateZoneDistanceKm = (pickup: ZoneSlug, destination: ZoneSlug): number => {
  if (pickup === destination) return 0;
  const from = ZONES[pickup];
  const to = ZONES[destination];

  const straightLine = calculateStraightLineDistanceKm(from.lat, from.lng, to.lat, to.lng);
  const roadDistance = straightLine * FARE_CONFIG.ROAD_FACTOR;

  // Round to nearest 100m (0.1 km)
  return Math.round(roadDistance * 10) / 10;
};

export interface FareBreakdown {
  distanceKm: number;
  baseFarePaisa: number;
  distanceChargePaisa: number;
  subtotalPaisa: number; // Solo fare
  discountPercent: number;
  poolDiscountPaisa: number;
  finalFarePaisa: number; // Total fare for this passenger (all booked seats)
  farePerSeatPaisa: number;
}

/**
 * Calculates fare for a passenger based on pickup, destination, requested seats, and current pool occupancy
 *
 * @param pickup Starting zone
 * @param destination Drop-off zone
 * @param seatsRequested Number of seats booked by this passenger (defaults to 1)
 * @param totalPoolSeats Total number of seats occupied in the pool (including this passenger)
 */
export const calculatePassengerFare = (
  pickup: ZoneSlug,
  destination: ZoneSlug,
  seatsRequested = 1,
  totalPoolSeats = 1,
): FareBreakdown => {
  const distanceKm = calculateZoneDistanceKm(pickup, destination);
  const baseFarePaisa = FARE_CONFIG.BASE_FARE_PAISA;
  const distanceChargePaisa = Math.round(distanceKm * FARE_CONFIG.PER_KM_PAISA);
  const subtotalPaisa = baseFarePaisa + distanceChargePaisa;

  // Discount percentage based on total occupied seats in the vehicle (capped at 3)
  const occupancy = Math.max(1, Math.min(3, totalPoolSeats));
  const discountPercent = FARE_CONFIG.DISCOUNT_PERCENT[occupancy] ?? 0;

  const poolDiscountPaisa = Math.round((subtotalPaisa * discountPercent) / 100);
  const farePerSeatPaisa = subtotalPaisa - poolDiscountPaisa;
  const finalFarePaisa = farePerSeatPaisa * seatsRequested;

  return {
    distanceKm,
    baseFarePaisa,
    distanceChargePaisa,
    subtotalPaisa,
    discountPercent,
    poolDiscountPaisa,
    finalFarePaisa,
    farePerSeatPaisa,
  };
};
