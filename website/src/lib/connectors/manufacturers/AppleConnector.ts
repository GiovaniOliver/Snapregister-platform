/**
 * Apple Connector
 *
 * Integrates with Apple's warranty registration API
 * Priority: CRITICAL (Tier 1)
 * Method: API (with manual assist fallback)
 * Expected Volume: 7-9% of all registrations
 */

import {
  ApiConnector,
  ConnectorConfig,
  RegistrationRequest,
  RegistrationResponse,
  ValidationResult,
  UserData,
  ProductData,
  PurchaseData,
} from '../base/ManufacturerConnector';
import { RegistrationMethod } from '@prisma/client';

interface AppleAPIRequest {
  serialNumber: string;
  purchaseDate: string; // ISO format
  owner: {
    email: string;
    firstName: string;
    lastName: string;
    country: string;
  };
  retailer?: string;
}

interface AppleAPIResponse {
  status: 'success' | 'error';
  confirmationNumber?: string;
  warrantyInfo?: {
    startDate: string;
    expiryDate: string;
    coverage: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export class AppleConnector extends ApiConnector {
  constructor() {
    const config: ConnectorConfig = {
      manufacturerId: 'apple',
      name: 'Apple Inc.',
      priority: 95,
      supportedMethods: ['API', 'ASSISTED_MANUAL'],
      rateLimit: {
        maxRequests: 100,
        windowMs: 60000, // 100 requests per minute
      },
      timeout: 5000,
      retryConfig: {
        maxAttempts: 3,
        backoffMs: 1000,
        maxBackoffMs: 5000,
      },
    };

    const baseUrl = process.env.APPLE_API_BASE_URL || 'https://api.apple.com/support';
    const headers = {
      'X-Apple-Partner-Id': process.env.APPLE_PARTNER_ID || '',
      'Authorization': `Bearer ${process.env.APPLE_JWT_TOKEN || ''}`,
    };

    super(config, baseUrl, headers);
  }

  /**
   * Main registration method
   */
  async register(request: RegistrationRequest): Promise<RegistrationResponse> {
    this.logger.info('Starting Apple registration', {
      serialNumber: request.product.serialNumber,
    });

    // Validate request
    const validation = this.validateRequest(request);
    if (!validation.valid) {
      return this.createErrorResponse(
        {
          code: 'VALIDATION_ERROR',
          message: validation.errors.join(', '),
          recoverable: false,
        },
        'API'
      );
    }

    try {
      // Execute with protection (circuit breaker + rate limiting)
      const response = await this.executeProtected(async () => {
        const apiRequest = this.mapToManufacturerFormat(request);
        return await this.request<AppleAPIResponse>('/v1/warranty/register', {
          method: 'POST',
          body: JSON.stringify(apiRequest),
        });
      });

      if (response.status === 'success' && response.confirmationNumber) {
        this.logger.info('Apple registration successful', {
          confirmationNumber: response.confirmationNumber,
        });

        return this.createSuccessResponse(
          response.confirmationNumber,
          'API',
          {
            warrantyInfo: response.warrantyInfo,
            registrationUrl: 'https://checkcoverage.apple.com/',
          }
        );
      } else {
        throw new Error(response.error?.message || 'Unknown error');
      }

    } catch (error) {
      this.logger.error('Apple registration failed', error);

      return this.createErrorResponse(
        {
          code: 'API_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          recoverable: true,
        },
        'API'
      );
    }
  }

  /**
   * Validate request data
   */
  validateRequest(request: RegistrationRequest): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!request.product.serialNumber) {
      errors.push('Serial number is required');
    } else if (!this.isValidSerialNumber(request.product.serialNumber)) {
      errors.push('Invalid Apple serial number format (must be 12 alphanumeric characters)');
    }

    if (!request.purchase.date) {
      errors.push('Purchase date is required');
    } else if (!this.isWithinWarrantyPeriod(request.purchase.date)) {
      warnings.push('Purchase date is older than 90 days - registration may be rejected');
    }

    if (!request.user.email) {
      errors.push('Email is required');
    } else if (!this.isValidEmail(request.user.email)) {
      errors.push('Invalid email format');
    }

    if (!request.user.firstName) {
      errors.push('First name is required');
    }

    if (!request.user.lastName) {
      errors.push('Last name is required');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Map to Apple's API format
   */
  mapToManufacturerFormat(request: RegistrationRequest): AppleAPIRequest {
    return {
      serialNumber: this.formatSerialNumber(request.product.serialNumber),
      purchaseDate: request.purchase.date.toISOString().split('T')[0],
      owner: {
        email: request.user.email,
        firstName: request.user.firstName,
        lastName: request.user.lastName,
        country: request.user.address?.country || 'US',
      },
      retailer: request.purchase.retailer,
    };
  }

  /**
   * Validate Apple serial number format
   */
  private isValidSerialNumber(serialNumber: string): boolean {
    // Apple serial numbers are typically 12 alphanumeric characters
    const cleaned = serialNumber.toUpperCase().replace(/[\s-]/g, '');
    return /^[A-Z0-9]{12}$/.test(cleaned);
  }

  /**
   * Format serial number to Apple's requirements
   */
  private formatSerialNumber(serialNumber: string): string {
    return serialNumber.toUpperCase().replace(/[\s-]/g, '');
  }

  /**
   * Check if purchase is within allowed period
   */
  private isWithinWarrantyPeriod(purchaseDate: Date): boolean {
    const daysSincePurchase = Math.floor(
      (Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSincePurchase <= 90;
  }

  /**
   * Simple email validation
   */
  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Override health check to use Apple's specific endpoint
   */
  async healthCheck() {
    const startTime = Date.now();

    try {
      await this.request('/v1/health', { method: 'GET' });

      return {
        healthy: true,
        latency: Date.now() - startTime,
        lastCheck: new Date(),
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
}

/**
 * Factory function to create Apple connector instance
 */
export function createAppleConnector(): AppleConnector {
  return new AppleConnector();
}
