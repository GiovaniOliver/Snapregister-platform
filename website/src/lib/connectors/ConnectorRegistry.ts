/**
 * Connector Registry
 *
 * Central registry for managing all manufacturer connectors
 * Provides factory pattern and connector lifecycle management
 */

import { ManufacturerConnector } from './base/ManufacturerConnector';
import { createAppleConnector } from './manufacturers/AppleConnector';
import { createSamsungConnector } from './manufacturers/SamsungConnector';
import { createWhirlpoolConnector } from './manufacturers/WhirlpoolConnector';
import { createLGConnector } from './manufacturers/LGConnector';
import { RegistrationMethod } from '@prisma/client';

type ConnectorFactory = () => ManufacturerConnector;

interface RegisteredConnector {
  instance: ManufacturerConnector;
  factory: ConnectorFactory;
  lastHealthCheck?: Date;
  healthStatus?: boolean;
}

export class ConnectorRegistry {
  private connectors: Map<string, RegisteredConnector> = new Map();
  private factories: Map<string, ConnectorFactory> = new Map();

  constructor() {
    this.registerDefaultConnectors();
  }

  /**
   * Register default connectors (Tier 1 manufacturers)
   */
  private registerDefaultConnectors(): void {
    // Tier 1 - Critical manufacturers
    this.registerConnectorFactory('apple', createAppleConnector);
    this.registerConnectorFactory('samsung', createSamsungConnector);
    this.registerConnectorFactory('whirlpool', createWhirlpoolConnector);
    this.registerConnectorFactory('lg', createLGConnector);

    // Add more as they are implemented
    // this.registerConnectorFactory('hp', createHPConnector);
    // this.registerConnectorFactory('dell', createDellConnector);
    // etc.
  }

  /**
   * Register a connector factory
   */
  registerConnectorFactory(manufacturerId: string, factory: ConnectorFactory): void {
    this.factories.set(manufacturerId, factory);

    // Lazy load - create instance on first use
    const instance = factory();
    this.connectors.set(manufacturerId, {
      instance,
      factory,
    });

    console.log(`[ConnectorRegistry] Registered connector: ${manufacturerId}`);
  }

  /**
   * Get connector instance for a manufacturer
   */
  getConnector(manufacturerId: string): ManufacturerConnector | null {
    const registered = this.connectors.get(manufacturerId);

    if (!registered) {
      console.warn(`[ConnectorRegistry] No connector found for: ${manufacturerId}`);
      return null;
    }

    return registered.instance;
  }

  /**
   * Get connector by method preference
   */
  getConnectorByMethod(
    manufacturerId: string,
    method: RegistrationMethod
  ): ManufacturerConnector | null {
    const connector = this.getConnector(manufacturerId);

    if (!connector) {
      return null;
    }

    const config = connector.getConfig();
    if (config.supportedMethods.includes(method)) {
      return connector;
    }

    return null;
  }

  /**
   * Get all registered connectors
   */
  getAllConnectors(): Map<string, ManufacturerConnector> {
    const connectorMap = new Map<string, ManufacturerConnector>();

    for (const [id, registered] of this.connectors.entries()) {
      connectorMap.set(id, registered.instance);
    }

    return connectorMap;
  }

  /**
   * Get connectors by tier (priority)
   */
  getConnectorsByTier(tier: 1 | 2 | 3): ManufacturerConnector[] {
    const tierPriorityRanges = {
      1: { min: 80, max: 100 },  // Top priority
      2: { min: 50, max: 79 },   // Medium priority
      3: { min: 0, max: 49 },    // Low priority
    };

    const range = tierPriorityRanges[tier];
    const connectors: ManufacturerConnector[] = [];

    for (const [_, registered] of this.connectors.entries()) {
      const priority = registered.instance.getConfig().priority;
      if (priority >= range.min && priority <= range.max) {
        connectors.push(registered.instance);
      }
    }

    // Sort by priority (descending)
    return connectors.sort((a, b) => {
      return b.getConfig().priority - a.getConfig().priority;
    });
  }

  /**
   * Check if connector exists for manufacturer
   */
  hasConnector(manufacturerId: string): boolean {
    return this.connectors.has(manufacturerId);
  }

  /**
   * Get connector health status
   */
  async getConnectorHealth(manufacturerId: string): Promise<{
    healthy: boolean;
    lastCheck: Date;
    details?: any;
  }> {
    const connector = this.getConnector(manufacturerId);

    if (!connector) {
      return {
        healthy: false,
        lastCheck: new Date(),
        details: { error: 'Connector not found' },
      };
    }

    try {
      const health = await connector.healthCheck();

      // Update cached health status
      const registered = this.connectors.get(manufacturerId);
      if (registered) {
        registered.lastHealthCheck = new Date();
        registered.healthStatus = health.healthy;
      }

      return {
        healthy: health.healthy,
        lastCheck: health.lastCheck,
        details: health.details,
      };
    } catch (error) {
      return {
        healthy: false,
        lastCheck: new Date(),
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Run health checks on all connectors
   */
  async healthCheckAll(): Promise<Map<string, boolean>> {
    const healthStatuses = new Map<string, boolean>();
    const promises: Promise<void>[] = [];

    for (const [manufacturerId, _] of this.connectors.entries()) {
      promises.push(
        this.getConnectorHealth(manufacturerId).then(health => {
          healthStatuses.set(manufacturerId, health.healthy);
        })
      );
    }

    await Promise.all(promises);
    return healthStatuses;
  }

  /**
   * Get circuit breaker status for all connectors
   */
  getCircuitBreakerStatuses(): Map<string, string> {
    const statuses = new Map<string, string>();

    for (const [manufacturerId, registered] of this.connectors.entries()) {
      const state = registered.instance.getCircuitBreakerState();
      statuses.set(manufacturerId, state);
    }

    return statuses;
  }

  /**
   * Reset circuit breaker for a specific connector
   */
  resetCircuitBreaker(manufacturerId: string): boolean {
    const connector = this.getConnector(manufacturerId);

    if (!connector) {
      return false;
    }

    connector.resetCircuitBreaker();
    console.log(`[ConnectorRegistry] Circuit breaker reset for: ${manufacturerId}`);
    return true;
  }

  /**
   * Reset all circuit breakers
   */
  resetAllCircuitBreakers(): void {
    for (const [manufacturerId, registered] of this.connectors.entries()) {
      registered.instance.resetCircuitBreaker();
      console.log(`[ConnectorRegistry] Circuit breaker reset for: ${manufacturerId}`);
    }
  }

  /**
   * Get connector statistics
   */
  getStatistics(): {
    totalConnectors: number;
    byTier: Record<number, number>;
    byMethod: Record<string, number>;
    healthyConnectors: number;
    circuitBreakersOpen: number;
  } {
    const stats = {
      totalConnectors: this.connectors.size,
      byTier: { 1: 0, 2: 0, 3: 0 } as Record<number, number>,
      byMethod: {} as Record<string, number>,
      healthyConnectors: 0,
      circuitBreakersOpen: 0,
    };

    for (const [_, registered] of this.connectors.entries()) {
      const config = registered.instance.getConfig();

      // Count by tier
      if (config.priority >= 80) stats.byTier[1]++;
      else if (config.priority >= 50) stats.byTier[2]++;
      else stats.byTier[3]++;

      // Count by method
      for (const method of config.supportedMethods) {
        stats.byMethod[method] = (stats.byMethod[method] || 0) + 1;
      }

      // Count healthy connectors
      if (registered.healthStatus === true) {
        stats.healthyConnectors++;
      }

      // Count circuit breakers open
      if (registered.instance.isCircuitOpen()) {
        stats.circuitBreakersOpen++;
      }
    }

    return stats;
  }

  /**
   * Reload connector (useful for hot-reloading configurations)
   */
  reloadConnector(manufacturerId: string): boolean {
    const registered = this.connectors.get(manufacturerId);

    if (!registered) {
      return false;
    }

    // Create new instance from factory
    const newInstance = registered.factory();

    // Replace instance
    this.connectors.set(manufacturerId, {
      ...registered,
      instance: newInstance,
      lastHealthCheck: undefined,
      healthStatus: undefined,
    });

    console.log(`[ConnectorRegistry] Reloaded connector: ${manufacturerId}`);
    return true;
  }

  /**
   * Unregister a connector
   */
  unregisterConnector(manufacturerId: string): boolean {
    const deleted = this.connectors.delete(manufacturerId);
    this.factories.delete(manufacturerId);

    if (deleted) {
      console.log(`[ConnectorRegistry] Unregistered connector: ${manufacturerId}`);
    }

    return deleted;
  }

  /**
   * Get list of supported manufacturer IDs
   */
  getSupportedManufacturers(): string[] {
    return Array.from(this.connectors.keys());
  }

  /**
   * Get connector capabilities
   */
  getConnectorCapabilities(manufacturerId: string): {
    supportsAPI: boolean;
    supportsAutomation: boolean;
    supportsBatch: boolean;
    requiresAuth: boolean;
  } | null {
    const connector = this.getConnector(manufacturerId);

    if (!connector) {
      return null;
    }

    return connector.getCapabilities();
  }
}

/**
 * Singleton instance
 */
let registryInstance: ConnectorRegistry | null = null;

/**
 * Get the global connector registry instance
 */
export function getConnectorRegistry(): ConnectorRegistry {
  if (!registryInstance) {
    registryInstance = new ConnectorRegistry();
  }
  return registryInstance;
}

/**
 * Reset the registry (useful for testing)
 */
export function resetConnectorRegistry(): void {
  registryInstance = null;
}
