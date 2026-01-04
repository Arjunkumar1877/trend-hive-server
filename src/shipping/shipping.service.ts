import { Injectable, BadRequestException } from '@nestjs/common';
import {
  CalculateShippingDto,
  ShippingMethod,
  ShippingRateDto,
  ShippingCalculationResponseDto,
  ShippingAddressDto,
} from './shipping.dto';

interface ShippingZone {
  countries: string[];
  standardRate: number;
  expressRate: number;
  overnightRate: number;
  freeShippingThreshold?: number;
}

@Injectable()
export class ShippingService {
  private readonly shippingZones: ShippingZone[] = [
    {
      countries: ['United States', 'USA', 'US'],
      standardRate: 5.99,
      expressRate: 12.99,
      overnightRate: 24.99,
      freeShippingThreshold: 50,
    },
    {
      countries: ['United Kingdom', 'UK', 'GB'],
      standardRate: 4.99,
      expressRate: 9.99,
      overnightRate: 19.99,
      freeShippingThreshold: 40,
    },
    {
      countries: ['Canada', 'CA'],
      standardRate: 7.99,
      expressRate: 14.99,
      overnightRate: 29.99,
      freeShippingThreshold: 60,
    },
    // Default zone for other countries
    {
      countries: ['*'],
      standardRate: 9.99,
      expressRate: 19.99,
      overnightRate: 39.99,
      freeShippingThreshold: 100,
    },
  ];

  private readonly weightMultiplier = 0.5; // $0.50 per kg
  private readonly currency = 'USD';

  /**
   * Calculate shipping cost for a given address and method
   */
  async calculateShipping(
    calculateShippingDto: CalculateShippingDto,
  ): Promise<ShippingCalculationResponseDto> {
    const zone = this.getShippingZone(calculateShippingDto.address.country);
    const baseRate = this.getBaseRate(zone, calculateShippingDto.method);

    // Calculate weight-based additional cost
    const weightCost =
      (calculateShippingDto.totalWeight || 0) * this.weightMultiplier;

    // Check if free shipping applies
    const orderSubtotal = calculateShippingDto.orderSubtotal || 0;
    const isFreeShipping =
      calculateShippingDto.method === ShippingMethod.FREE ||
      (zone.freeShippingThreshold &&
        orderSubtotal >= zone.freeShippingThreshold);

    let finalCost = baseRate + weightCost;
    if (isFreeShipping && calculateShippingDto.method !== ShippingMethod.FREE) {
      // If order qualifies for free shipping but user selected paid method
      // Still show free option
    }

    if (calculateShippingDto.method === ShippingMethod.FREE || isFreeShipping) {
      finalCost = 0;
    }

    // Get all available methods for comparison
    const availableMethods = this.getAllAvailableMethods(
      zone,
      orderSubtotal,
      calculateShippingDto.totalWeight || 0,
    );

    const selectedMethod = availableMethods.find(
      (m) => m.method === calculateShippingDto.method,
    ) || availableMethods[0];

    return {
      availableMethods,
      selectedMethod,
      address: calculateShippingDto.address,
    };
  }

  /**
   * Get all available shipping methods with rates
   */
  async getAvailableShippingMethods(
    address: ShippingAddressDto,
    orderSubtotal: number = 0,
    totalWeight: number = 0,
  ): Promise<ShippingRateDto[]> {
    const zone = this.getShippingZone(address.country);
    return this.getAllAvailableMethods(zone, orderSubtotal, totalWeight);
  }

  /**
   * Get estimated delivery days for a shipping method
   */
  getEstimatedDays(method: ShippingMethod): number {
    switch (method) {
      case ShippingMethod.STANDARD:
        return 5;
      case ShippingMethod.EXPRESS:
        return 2;
      case ShippingMethod.OVERNIGHT:
        return 1;
      case ShippingMethod.FREE:
        return 5; // Same as standard
      default:
        return 5;
    }
  }

  /**
   * Get method display name
   */
  getMethodName(method: ShippingMethod): string {
    switch (method) {
      case ShippingMethod.STANDARD:
        return 'Standard Shipping';
      case ShippingMethod.EXPRESS:
        return 'Express Shipping';
      case ShippingMethod.OVERNIGHT:
        return 'Overnight Shipping';
      case ShippingMethod.FREE:
        return 'Free Shipping';
      default:
        return 'Standard Shipping';
    }
  }

  /**
   * Get shipping zone for a country
   */
  private getShippingZone(country: string): ShippingZone {
    const normalizedCountry = country.trim();

    // Find specific zone for country
    for (const zone of this.shippingZones) {
      if (zone.countries.includes(normalizedCountry)) {
        return zone;
      }
    }

    // Return default zone
    return this.shippingZones[this.shippingZones.length - 1];
  }

  /**
   * Get base rate for a shipping method in a zone
   */
  private getBaseRate(zone: ShippingZone, method: ShippingMethod): number {
    switch (method) {
      case ShippingMethod.STANDARD:
        return zone.standardRate;
      case ShippingMethod.EXPRESS:
        return zone.expressRate;
      case ShippingMethod.OVERNIGHT:
        return zone.overnightRate;
      case ShippingMethod.FREE:
        return 0;
      default:
        return zone.standardRate;
    }
  }

  /**
   * Get all available methods with calculated rates
   */
  private getAllAvailableMethods(
    zone: ShippingZone,
    orderSubtotal: number,
    totalWeight: number,
  ): ShippingRateDto[] {
    const methods: ShippingRateDto[] = [];
    const weightCost = totalWeight * this.weightMultiplier;
    const qualifiesForFree =
      zone.freeShippingThreshold && orderSubtotal >= zone.freeShippingThreshold;

    // Standard shipping
    methods.push({
      method: ShippingMethod.STANDARD,
      methodName: this.getMethodName(ShippingMethod.STANDARD),
      cost: qualifiesForFree ? 0 : zone.standardRate + weightCost,
      estimatedDays: this.getEstimatedDays(ShippingMethod.STANDARD),
      currency: this.currency,
    });

    // Express shipping
    methods.push({
      method: ShippingMethod.EXPRESS,
      methodName: this.getMethodName(ShippingMethod.EXPRESS),
      cost: qualifiesForFree ? 0 : zone.expressRate + weightCost,
      estimatedDays: this.getEstimatedDays(ShippingMethod.EXPRESS),
      currency: this.currency,
    });

    // Overnight shipping
    methods.push({
      method: ShippingMethod.OVERNIGHT,
      methodName: this.getMethodName(ShippingMethod.OVERNIGHT),
      cost: zone.overnightRate + weightCost, // Overnight never free
      estimatedDays: this.getEstimatedDays(ShippingMethod.OVERNIGHT),
      currency: this.currency,
    });

    // Free shipping option (if qualifies)
    if (qualifiesForFree) {
      methods.push({
        method: ShippingMethod.FREE,
        methodName: this.getMethodName(ShippingMethod.FREE),
        cost: 0,
        estimatedDays: this.getEstimatedDays(ShippingMethod.FREE),
        currency: this.currency,
      });
    }

    return methods;
  }

  /**
   * Validate shipping address
   */
  validateShippingAddress(address: ShippingAddressDto): boolean {
    if (!address.fullName || !address.addressLine1 || !address.city || !address.state || !address.postalCode || !address.country) {
      return false;
    }
    return true;
  }

  /**
   * Check if order qualifies for free shipping
   */
  checkFreeShippingEligibility(
    country: string,
    orderSubtotal: number,
  ): boolean {
    const zone = this.getShippingZone(country);
    return (
      zone.freeShippingThreshold !== undefined &&
      orderSubtotal >= zone.freeShippingThreshold
    );
  }

  /**
   * Get free shipping threshold for a country
   */
  getFreeShippingThreshold(country: string): number | undefined {
    const zone = this.getShippingZone(country);
    return zone.freeShippingThreshold;
  }
}

