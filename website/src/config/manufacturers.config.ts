/**
 * Manufacturer Configuration
 *
 * Central configuration for all manufacturer integrations
 * Based on top-100-manufacturers-api-research.md
 */

import { RegistrationMethod } from '@prisma/client';

export interface FieldTransform {
  transform?: 'uppercase' | 'lowercase' | 'remove_spaces';
  removeSpaces?: boolean;
  pattern?: string;
  length?: { min?: number; max?: number };
}

export interface ManufacturerConfig {
  id: string;
  name: string;
  tier: 1 | 2 | 3;
  estimatedVolume: number; // Percentage of total registrations (0-1)

  // API Configuration
  api?: {
    baseUrl: string;
    authType: 'oauth2' | 'apiKey' | 'jwt' | 'basic' | 'none';
    credentials?: {
      source: 'env' | 'vault' | 'config';
      envKey?: string; // Environment variable name
    };
    endpoints: {
      register?: string;
      validate?: string;
      status?: string;
      health?: string;
    };
    headers?: Record<string, string>;
    requestFormat: 'json' | 'formData' | 'xml';
    responseFormat: 'json' | 'xml' | 'html';
  };

  // Web Automation Configuration
  automation?: {
    registrationUrl: string;
    selectors: {
      form?: string;
      fields: Record<string, string>;
      submitButton: string;
      successIndicator?: string;
      errorIndicator?: string;
    };
    waitConditions?: ('load' | 'domcontentloaded' | 'networkidle')[];
    captchaHandler?: 'manual' | '2captcha' | 'anticaptcha' | 'none';
  };

  // Field Mapping
  fieldMapping: {
    required: string[];
    optional: string[];
    custom: Record<string, FieldTransform>;
  };

  // Validation Rules
  validation: {
    serialNumber?: {
      pattern?: string;
      length?: { min?: number; max?: number };
      transform?: 'uppercase' | 'lowercase' | 'remove_spaces';
    };
    modelNumber?: {
      pattern?: string;
      required?: boolean;
    };
    purchaseDate?: {
      maxAge?: number; // Days
      format?: string;
    };
  };

  // Fallback Strategy
  fallback: {
    primary: RegistrationMethod;
    secondary?: RegistrationMethod;
    tertiary?: RegistrationMethod;
    manualAssist: {
      pdfUrl?: string;
      emailTemplate?: string;
      instructions?: string;
    };
  };

  // Monitoring Configuration
  monitoring: {
    healthCheckUrl?: string;
    expectedSuccessRate: number; // 0-1
    alertThresholds: {
      errorRate: number; // 0-1
      latency: number; // ms
      consecutiveFailures: number;
    };
  };

  // Additional metadata
  metadata?: {
    website?: string;
    supportEmail?: string;
    supportPhone?: string;
    logo?: string;
  };
}

/**
 * TIER 1 MANUFACTURERS (Top 20)
 * Focus automation here first - Target 90%+ success rate
 */

export const TIER_1_MANUFACTURERS: Record<string, ManufacturerConfig> = {
  samsung: {
    id: 'samsung',
    name: 'Samsung Electronics',
    tier: 1,
    estimatedVolume: 0.09,
    api: {
      baseUrl: 'https://api.samsung.com/warranty',
      authType: 'oauth2',
      credentials: {
        source: 'env',
        envKey: 'SAMSUNG_API_KEY',
      },
      endpoints: {
        register: '/v1/products/register',
        validate: '/v1/products/validate',
        status: '/v1/registrations/{id}',
        health: '/v1/health',
      },
      headers: {
        'X-Samsung-Partner': '${SAMSUNG_PARTNER_ID}',
      },
      requestFormat: 'json',
      responseFormat: 'json',
    },
    automation: {
      registrationUrl: 'https://www.samsung.com/us/support/register/',
      selectors: {
        form: '#registration-form',
        fields: {
          serialNumber: 'input[name="serialNumber"]',
          modelNumber: 'input[name="modelNumber"]',
          purchaseDate: 'input[name="purchaseDate"]',
          firstName: 'input[name="firstName"]',
          lastName: 'input[name="lastName"]',
          email: 'input[name="email"]',
          phone: 'input[name="phone"]',
          address: 'input[name="address1"]',
          city: 'input[name="city"]',
          state: 'select[name="state"]',
          zipCode: 'input[name="zip"]',
        },
        submitButton: 'button[type="submit"]',
        successIndicator: '.registration-success',
        errorIndicator: '.error-message',
      },
      waitConditions: ['networkidle', 'domcontentloaded'],
      captchaHandler: 'none',
    },
    fieldMapping: {
      required: ['serialNumber', 'modelNumber', 'purchaseDate', 'email'],
      optional: ['phone', 'address', 'city', 'state', 'zipCode'],
      custom: {
        serialNumber: {
          transform: 'uppercase',
          removeSpaces: true,
        },
      },
    },
    validation: {
      serialNumber: {
        pattern: '^[A-Z0-9]{8,20}$',
        transform: 'uppercase',
      },
      purchaseDate: {
        maxAge: 365,
        format: 'MM/DD/YYYY',
      },
    },
    fallback: {
      primary: 'API',
      secondary: 'AUTOMATION_RELIABLE',
      tertiary: 'ASSISTED_MANUAL',
      manualAssist: {
        emailTemplate: 'samsung_manual_registration',
        instructions: 'Visit Samsung.com/register and enter your information',
      },
    },
    monitoring: {
      expectedSuccessRate: 0.85,
      alertThresholds: {
        errorRate: 0.2,
        latency: 5000,
        consecutiveFailures: 5,
      },
    },
    metadata: {
      website: 'https://www.samsung.com',
      supportEmail: 'support@samsung.com',
    },
  },

  apple: {
    id: 'apple',
    name: 'Apple Inc.',
    tier: 1,
    estimatedVolume: 0.08,
    api: {
      baseUrl: 'https://api.apple.com/support',
      authType: 'jwt',
      credentials: {
        source: 'vault',
        envKey: 'APPLE_JWT_TOKEN',
      },
      endpoints: {
        register: '/v1/warranty/register',
        validate: '/v1/device/validate',
        status: '/v1/warranty/status',
        health: '/v1/health',
      },
      headers: {
        'X-Apple-Partner-Id': '${APPLE_PARTNER_ID}',
      },
      requestFormat: 'json',
      responseFormat: 'json',
    },
    fieldMapping: {
      required: ['serialNumber', 'purchaseDate', 'email'],
      optional: ['firstName', 'lastName', 'country'],
      custom: {
        serialNumber: {
          transform: 'uppercase',
          length: { min: 12, max: 12 },
        },
      },
    },
    validation: {
      serialNumber: {
        pattern: '^[A-Z0-9]{12}$',
        transform: 'uppercase',
      },
      purchaseDate: {
        maxAge: 90,
        format: 'YYYY-MM-DD',
      },
    },
    fallback: {
      primary: 'API',
      secondary: 'ASSISTED_MANUAL',
      manualAssist: {
        pdfUrl: 'https://support.apple.com/register',
        instructions: 'Use Apple Check Coverage tool at checkcoverage.apple.com',
      },
    },
    monitoring: {
      healthCheckUrl: 'https://api.apple.com/health',
      expectedSuccessRate: 0.95,
      alertThresholds: {
        errorRate: 0.1,
        latency: 3000,
        consecutiveFailures: 3,
      },
    },
    metadata: {
      website: 'https://www.apple.com',
      supportEmail: 'support@apple.com',
    },
  },

  lg: {
    id: 'lg',
    name: 'LG Electronics',
    tier: 1,
    estimatedVolume: 0.07,
    automation: {
      registrationUrl: 'https://www.lg.com/us/support/product-registration',
      selectors: {
        fields: {
          serialNumber: 'input[name="serial"]',
          modelNumber: 'input[name="model"]',
          purchaseDate: 'input[name="purchaseDate"]',
          firstName: 'input[name="firstName"]',
          lastName: 'input[name="lastName"]',
          email: 'input[name="email"]',
          phone: 'input[name="phone"]',
        },
        submitButton: 'button#submit-registration',
        successIndicator: '.success-message',
      },
      waitConditions: ['domcontentloaded'],
    },
    fieldMapping: {
      required: ['serialNumber', 'modelNumber', 'purchaseDate', 'email'],
      optional: ['phone', 'address'],
      custom: {
        serialNumber: {
          transform: 'uppercase',
        },
      },
    },
    validation: {
      serialNumber: {
        pattern: '^[A-Z0-9]{9,}$',
      },
    },
    fallback: {
      primary: 'AUTOMATION_RELIABLE',
      secondary: 'ASSISTED_MANUAL',
      manualAssist: {
        instructions: 'Register at lg.com/support/product-registration',
      },
    },
    monitoring: {
      expectedSuccessRate: 0.8,
      alertThresholds: {
        errorRate: 0.25,
        latency: 8000,
        consecutiveFailures: 5,
      },
    },
  },

  whirlpool: {
    id: 'whirlpool',
    name: 'Whirlpool Corporation',
    tier: 1,
    estimatedVolume: 0.06,
    automation: {
      registrationUrl: 'https://www.whirlpool.com/services/product-registration.html',
      selectors: {
        fields: {
          serialNumber: '#serial-number',
          modelNumber: '#model-number',
          purchaseDate: '#purchase-date',
          email: '#email',
          firstName: '#first-name',
          lastName: '#last-name',
        },
        submitButton: 'button.submit-btn',
        successIndicator: '.registration-complete',
      },
      waitConditions: ['networkidle'],
    },
    fieldMapping: {
      required: ['serialNumber', 'modelNumber', 'email'],
      optional: ['purchaseDate', 'phone'],
      custom: {
        serialNumber: {
          transform: 'uppercase',
          removeSpaces: true,
        },
      },
    },
    validation: {
      serialNumber: {
        pattern: '^[A-Z0-9]{10,15}$',
      },
    },
    fallback: {
      primary: 'AUTOMATION_RELIABLE',
      secondary: 'ASSISTED_MANUAL',
      manualAssist: {
        instructions: 'Register at whirlpool.com/services/product-registration',
      },
    },
    monitoring: {
      expectedSuccessRate: 0.75,
      alertThresholds: {
        errorRate: 0.3,
        latency: 10000,
        consecutiveFailures: 6,
      },
    },
    metadata: {
      website: 'https://www.whirlpool.com',
    },
  },

  // Add more Tier 1 manufacturers as they are implemented...
};

/**
 * TIER 2 MANUFACTURERS (21-50)
 * Medium priority - build after Tier 1 proven
 */
export const TIER_2_MANUFACTURERS: Record<string, ManufacturerConfig> = {
  // Will be populated as we expand
};

/**
 * TIER 3 MANUFACTURERS (51-100)
 * Low priority - use assisted manual initially
 */
export const TIER_3_MANUFACTURERS: Record<string, ManufacturerConfig> = {
  // Will be populated for long-tail support
};

/**
 * All manufacturers combined
 */
export const MANUFACTURERS: Record<string, ManufacturerConfig> = {
  ...TIER_1_MANUFACTURERS,
  ...TIER_2_MANUFACTURERS,
  ...TIER_3_MANUFACTURERS,
};

/**
 * Get manufacturer config by ID
 */
export function getManufacturerConfig(manufacturerId: string): ManufacturerConfig | null {
  return MANUFACTURERS[manufacturerId] || null;
}

/**
 * Get all manufacturers by tier
 */
export function getManufacturersByTier(tier: 1 | 2 | 3): ManufacturerConfig[] {
  return Object.values(MANUFACTURERS).filter(config => config.tier === tier);
}

/**
 * Get manufacturers sorted by volume
 */
export function getManufacturersByVolume(): ManufacturerConfig[] {
  return Object.values(MANUFACTURERS).sort((a, b) => b.estimatedVolume - a.estimatedVolume);
}

/**
 * Check if manufacturer has API support
 */
export function hasAPISupport(manufacturerId: string): boolean {
  const config = getManufacturerConfig(manufacturerId);
  return config?.api !== undefined;
}

/**
 * Check if manufacturer has automation support
 */
export function hasAutomationSupport(manufacturerId: string): boolean {
  const config = getManufacturerConfig(manufacturerId);
  return config?.automation !== undefined;
}

/**
 * Get supported manufacturer IDs
 */
export function getSupportedManufacturers(): string[] {
  return Object.keys(MANUFACTURERS);
}

/**
 * Get manufacturer count by tier
 */
export function getManufacturerCountByTier(): Record<number, number> {
  const counts = { 1: 0, 2: 0, 3: 0 };

  Object.values(MANUFACTURERS).forEach(config => {
    counts[config.tier]++;
  });

  return counts;
}
