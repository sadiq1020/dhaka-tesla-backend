import { describe, it, expect } from 'vitest';
import {
  calculateZoneDistanceKm,
  calculatePassengerFare,
} from './fare.js';
import { areRoutesCompatible } from './zones.js';

describe('Zones and Corridor Matching', () => {
  it('should match Nusrat and Rafiq on shared Banani corridor', () => {
    // Nusrat: Banani -> Mohakhali
    // Rafiq: Banani -> Gulshan 1
    const compatible = areRoutesCompatible('banani', 'mohakhali', 'gulshan-1');
    expect(compatible).toBe(true);
  });

  it('should reject incompatible routes with no shared corridor', () => {
    // Banani -> Rampura and Banani -> Uttara
    const compatible = areRoutesCompatible('banani', 'rampura', 'uttara');
    expect(compatible).toBe(false);
  });

  it('should allow two passengers going to the exact same destination', () => {
    const compatible = areRoutesCompatible('banani', 'mohakhali', 'mohakhali');
    expect(compatible).toBe(true);
  });
});

describe('Fare Calculation Module', () => {
  it('calculates the exact distance from Banani to Mohakhali as 2.3 km', () => {
    const distance = calculateZoneDistanceKm('banani', 'mohakhali');
    expect(distance).toBe(2.3);
  });

  it('calculates solo fare for Nusrat (Banani to Mohakhali, 1 rider)', () => {
    const fare = calculatePassengerFare('banani', 'mohakhali', 1, 1);
    expect(fare.distanceKm).toBe(2.3);
    expect(fare.baseFarePaisa).toBe(2000); // ৳20.00
    expect(fare.distanceChargePaisa).toBe(3450); // 2.3 * 1500 = 3450 (৳34.50)
    expect(fare.subtotalPaisa).toBe(5450); // ৳54.50
    expect(fare.discountPercent).toBe(0);
    expect(fare.poolDiscountPaisa).toBe(0);
    expect(fare.finalFarePaisa).toBe(5450); // ৳54.50
  });

  it('calculates pooled fare for Nusrat when Rafiq joins (2 riders, 15% discount)', () => {
    const fare = calculatePassengerFare('banani', 'mohakhali', 1, 2);
    expect(fare.subtotalPaisa).toBe(5450);
    expect(fare.discountPercent).toBe(15);
    // 5450 * 0.15 = 817.5 -> round to 818 paisa
    expect(fare.poolDiscountPaisa).toBe(818);
    // 5450 - 818 = 4632 paisa (৳46.32)
    expect(fare.finalFarePaisa).toBe(4632);
  });

  it('calculates pooled fare when Shirin grabs the last seat (3 riders, 25% discount)', () => {
    const fare = calculatePassengerFare('banani', 'mohakhali', 1, 3);
    expect(fare.subtotalPaisa).toBe(5450);
    expect(fare.discountPercent).toBe(25);
    // 5450 * 0.25 = 1362.5 -> round to 1363 paisa
    expect(fare.poolDiscountPaisa).toBe(1363);
    // 5450 - 1363 = 4087 paisa (৳40.87)
    expect(fare.finalFarePaisa).toBe(4087);
  });

  it('correctly calculates fare when a passenger books multiple seats', () => {
    // Passenger books 2 seats in a full 3-seat pool
    const fare = calculatePassengerFare('banani', 'mohakhali', 2, 3);
    expect(fare.farePerSeatPaisa).toBe(4087);
    expect(fare.finalFarePaisa).toBe(4087 * 2);
  });
});
