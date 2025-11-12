/**
 * Manufacturer Automation Registry
 *
 * Central registry for all manufacturer-specific automation scripts.
 * Add new manufacturers here as they are implemented.
 */

import { BaseAutomation } from '../core/BaseAutomation';
import { SamsungAutomation } from './SamsungAutomation';
import { AppleAutomation } from './AppleAutomation';
import { LGAutomation } from './LGAutomation';
import { HPAutomation } from './HPAutomation';

type AutomationConstructor = new () => BaseAutomation;

export class ManufacturerRegistry {
  private static automations = new Map<string, AutomationConstructor>();

  static {
    // Register all available automations
    this.register('Samsung', SamsungAutomation);
    this.register('Apple', AppleAutomation);
    this.register('LG', LGAutomation);
    this.register('HP', HPAutomation);

    // Whirlpool brands (use same automation)
    // TODO: Implement WhirlpoolAutomation
    // this.register('Whirlpool', WhirlpoolAutomation);
    // this.register('KitchenAid', WhirlpoolAutomation);
    // this.register('Maytag', WhirlpoolAutomation);
    // this.register('Amana', WhirlpoolAutomation);
    // this.register('Jenn-Air', WhirlpoolAutomation);

    // TODO: Add more manufacturers
    // this.register('Sony', SonyAutomation);
    // this.register('Dell', DellAutomation);
  }

  /**
   * Register a manufacturer automation
   */
  static register(manufacturer: string, automation: AutomationConstructor): void {
    const normalizedName = manufacturer.toLowerCase().trim();
    this.automations.set(normalizedName, automation);
    console.log(`Registered automation for: ${manufacturer}`);
  }

  /**
   * Get automation instance for a manufacturer
   */
  static get(manufacturer: string): BaseAutomation | null {
    const normalizedName = manufacturer.toLowerCase().trim();
    const AutomationClass = this.automations.get(normalizedName);

    if (!AutomationClass) {
      console.warn(`No automation found for manufacturer: ${manufacturer}`);
      return null;
    }

    return new AutomationClass();
  }

  /**
   * Check if automation exists for a manufacturer
   */
  static has(manufacturer: string): boolean {
    const normalizedName = manufacturer.toLowerCase().trim();
    return this.automations.has(normalizedName);
  }

  /**
   * Get list of all supported manufacturers
   */
  static getAll(): string[] {
    return Array.from(this.automations.keys());
  }

  /**
   * Get automation info for all manufacturers
   */
  static getAllInfo(): Array<{
    manufacturer: string;
    automationType: 'reliable' | 'experimental';
    requiredFields: string[];
  }> {
    const info: Array<any> = [];

    for (const [name, AutomationClass] of this.automations.entries()) {
      const instance = new AutomationClass();
      info.push({
        manufacturer: instance.manufacturer,
        automationType: instance.automationType,
        requiredFields: instance.requiredFields
      });
    }

    return info;
  }

  /**
   * Get count of registered automations
   */
  static count(): number {
    return this.automations.size;
  }
}

// Export individual automations for direct use
export { SamsungAutomation } from './SamsungAutomation';
export { AppleAutomation } from './AppleAutomation';
export { LGAutomation } from './LGAutomation';
export { HPAutomation } from './HPAutomation';
