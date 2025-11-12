/**
 * Manufacturer Detection Service
 *
 * Identifies manufacturers not in our database and suggests:
 * 1. Whether to use Generic automation
 * 2. Priority for adding dedicated automation
 * 3. Common registration URL patterns
 *
 * This service helps expand our automation coverage automatically.
 */

import { ManufacturerRegistry } from '../manufacturers';
import { GenericAutomation } from '../manufacturers/GenericAutomation';
import { BaseAutomation } from '../core/BaseAutomation';

export interface ManufacturerDetection {
  manufacturer: string;
  hasAutomation: boolean;
  automationType: 'specific' | 'generic' | 'none';
  suggestedUrl?: string;
  confidence: 'high' | 'medium' | 'low';
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ManufacturerUsageStats {
  manufacturer: string;
  registrationAttempts: number;
  successRate: number;
  lastAttempt: Date;
  hasAutomation: boolean;
}

export class ManufacturerDetector {
  private static unknownManufacturers = new Map<string, {
    count: number;
    firstSeen: Date;
    lastSeen: Date;
    registrationUrls: Set<string>;
  }>();

  /**
   * Detect if manufacturer has automation and suggest approach
   */
  static detect(manufacturerName: string, productData?: any): ManufacturerDetection {
    const hasAutomation = ManufacturerRegistry.has(manufacturerName);

    if (hasAutomation) {
      return {
        manufacturer: manufacturerName,
        hasAutomation: true,
        automationType: 'specific',
        confidence: 'high',
        recommendation: `Use dedicated ${manufacturerName} automation`,
        priority: 'high'
      };
    }

    // Track unknown manufacturer
    this.trackUnknownManufacturer(manufacturerName);

    // Suggest registration URL based on common patterns
    const suggestedUrl = this.guessRegistrationUrl(manufacturerName);

    // Determine priority based on popularity
    const stats = this.unknownManufacturers.get(manufacturerName.toLowerCase());
    const priority = stats && stats.count > 5 ? 'high' : stats && stats.count > 2 ? 'medium' : 'low';

    return {
      manufacturer: manufacturerName,
      hasAutomation: false,
      automationType: 'generic',
      suggestedUrl,
      confidence: 'medium',
      recommendation: `Use Generic automation. Consider adding dedicated automation if frequently requested.`,
      priority
    };
  }

  /**
   * Get automation instance for manufacturer (specific or generic)
   */
  static getAutomation(manufacturerName: string, registrationUrl?: string): BaseAutomation {
    // Try to get specific automation first
    const specificAutomation = ManufacturerRegistry.get(manufacturerName);
    if (specificAutomation) {
      return specificAutomation;
    }

    // Fall back to generic automation
    const genericUrl = registrationUrl || this.guessRegistrationUrl(manufacturerName);
    return new GenericAutomation(manufacturerName, genericUrl);
  }

  /**
   * Track unknown manufacturer for analytics
   */
  private static trackUnknownManufacturer(manufacturerName: string, url?: string): void {
    const key = manufacturerName.toLowerCase();
    const existing = this.unknownManufacturers.get(key);

    if (existing) {
      existing.count++;
      existing.lastSeen = new Date();
      if (url) existing.registrationUrls.add(url);
    } else {
      this.unknownManufacturers.set(key, {
        count: 1,
        firstSeen: new Date(),
        lastSeen: new Date(),
        registrationUrls: new Set(url ? [url] : [])
      });
    }
  }

  /**
   * Guess registration URL based on manufacturer name
   */
  private static guessRegistrationUrl(manufacturerName: string): string {
    const cleanName = manufacturerName.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Common registration URL patterns
    const patterns = [
      `https://www.${cleanName}.com/support/product-registration`,
      `https://www.${cleanName}.com/register`,
      `https://www.${cleanname}.com/warranty/registration`,
      `https://www.${cleanName}.com/support/register`,
      `https://register.${cleanName}.com`,
      `https://warranty.${cleanName}.com/register`
    ];

    return patterns[0]; // Return most common pattern
  }

  /**
   * Get statistics on unknown manufacturers
   */
  static getUnknownManufacturers(): ManufacturerUsageStats[] {
    const stats: ManufacturerUsageStats[] = [];

    for (const [name, data] of this.unknownManufacturers.entries()) {
      stats.push({
        manufacturer: name,
        registrationAttempts: data.count,
        successRate: 0, // Would be calculated from actual attempts
        lastAttempt: data.lastSeen,
        hasAutomation: false
      });
    }

    // Sort by registration attempts (most popular first)
    return stats.sort((a, b) => b.registrationAttempts - a.registrationAttempts);
  }

  /**
   * Get top manufacturers that should be prioritized for automation
   */
  static getPriorityManufacturers(limit: number = 10): string[] {
    const unknown = this.getUnknownManufacturers();
    return unknown.slice(0, limit).map(stat => stat.manufacturer);
  }

  /**
   * Check if manufacturer should trigger alert for new automation
   */
  static shouldCreateAutomation(manufacturerName: string): boolean {
    const stats = this.unknownManufacturers.get(manufacturerName.toLowerCase());
    if (!stats) return false;

    // Suggest automation if:
    // 1. More than 10 attempts
    // 2. Or more than 5 attempts in last 30 days
    if (stats.count > 10) return true;

    const daysSinceFirst = (new Date().getTime() - stats.firstSeen.getTime()) / (1000 * 60 * 60 * 24);
    if (stats.count > 5 && daysSinceFirst < 30) return true;

    return false;
  }

  /**
   * Get all supported manufacturers (from registry)
   */
  static getSupportedManufacturers(): string[] {
    return ManufacturerRegistry.getAll();
  }

  /**
   * Search for similar manufacturer names (fuzzy matching)
   */
  static findSimilarManufacturers(searchTerm: string): string[] {
    const supported = this.getSupportedManufacturers();
    const search = searchTerm.toLowerCase();

    // Exact match first
    const exactMatch = supported.filter(m => m.toLowerCase() === search);
    if (exactMatch.length > 0) return exactMatch;

    // Contains match
    const containsMatch = supported.filter(m => m.toLowerCase().includes(search));
    if (containsMatch.length > 0) return containsMatch;

    // Starts with match
    const startsWithMatch = supported.filter(m => m.toLowerCase().startsWith(search));
    return startsWithMatch;
  }

  /**
   * Recommend automation based on product category
   */
  static recommendByCategory(category: string): string[] {
    const categoryMap: Record<string, string[]> = {
      'electronics': ['Samsung', 'Sony', 'LG', 'Apple'],
      'appliances': ['Whirlpool', 'GE Appliances', 'Bosch', 'Maytag'],
      'computers': ['Dell', 'HP', 'Apple', 'Lenovo'],
      'cameras': ['Canon', 'Sony', 'Nikon', 'Panasonic'],
      'printers': ['HP', 'Canon', 'Epson', 'Brother']
    };

    const cat = category.toLowerCase();
    for (const [key, manufacturers] of Object.entries(categoryMap)) {
      if (cat.includes(key)) {
        return manufacturers.filter(m => ManufacturerRegistry.has(m));
      }
    }

    return [];
  }

  /**
   * Clear tracking data (for testing or reset)
   */
  static clearTracking(): void {
    this.unknownManufacturers.clear();
  }

  /**
   * Export tracking data for analytics
   */
  static exportTrackingData(): any {
    const data: any[] = [];

    for (const [name, stats] of this.unknownManufacturers.entries()) {
      data.push({
        manufacturer: name,
        count: stats.count,
        firstSeen: stats.firstSeen.toISOString(),
        lastSeen: stats.lastSeen.toISOString(),
        urls: Array.from(stats.registrationUrls)
      });
    }

    return data;
  }
}
