/**
 * Form Field Mappings Configuration
 * 
 * Pre-configured field mappings for common manufacturers.
 * These mappings can be used to improve automation reliability
 * when intelligent detection isn't sufficient.
 */

import { FormFieldMapping } from '../services/FormAutomationService';

export const FORM_MAPPINGS: Record<string, FormFieldMapping> = {
  samsung: {
    serialNumber: {
      selector: '[data-di-id="serial-number"], #serialNumber, input[name="serialNumber"]',
      type: 'text',
      required: true,
      fallbackSelectors: [
        'input[placeholder*="Serial" i]',
        'input[name="serial"]'
      ]
    },
    modelNumber: {
      selector: '[data-di-id="model-number"], #modelNumber, input[name="modelNumber"]',
      type: 'text',
      required: true,
      fallbackSelectors: [
        'input[placeholder*="Model" i]',
        'input[name="model"]'
      ]
    },
    firstName: {
      selector: '[data-di-id="first-name"], #firstName, input[name="firstName"]',
      type: 'text',
      required: true,
      fallbackSelectors: [
        'input[name="first_name"]',
        'input[placeholder*="First" i]'
      ]
    },
    lastName: {
      selector: '[data-di-id="last-name"], #lastName, input[name="lastName"]',
      type: 'text',
      required: true,
      fallbackSelectors: [
        'input[name="last_name"]',
        'input[placeholder*="Last" i]'
      ]
    },
    email: {
      selector: '[data-di-id="email"], #email, input[name="email"], input[type="email"]',
      type: 'email',
      required: true
    },
    phone: {
      selector: '[data-di-id="phone"], #phone, input[name="phone"], input[type="tel"]',
      type: 'tel',
      required: false
    },
    address: {
      selector: '[data-di-id="address"], #address, input[name="address"]',
      type: 'text',
      required: false
    },
    city: {
      selector: '[data-di-id="city"], #city, input[name="city"]',
      type: 'text',
      required: false
    },
    state: {
      selector: '[data-di-id="state"], #state, select[name="state"]',
      type: 'select',
      required: false
    },
    zipCode: {
      selector: '[data-di-id="zip"], #zip, input[name="zip"], input[name="zipCode"]',
      type: 'text',
      required: false
    },
    purchaseDate: {
      selector: '[data-di-id="purchase-date"], #purchaseDate, input[name="purchaseDate"]',
      type: 'date',
      required: false
    },
    retailer: {
      selector: '[data-di-id="retailer"], #retailer, select[name="retailer"]',
      type: 'select',
      required: false
    }
  },

  lg: {
    serialNumber: {
      selector: '#serialNumber, input[name="serialNumber"]',
      type: 'text',
      required: true,
      fallbackSelectors: [
        'input[placeholder*="Serial" i]'
      ]
    },
    modelNumber: {
      selector: '#modelNumber, input[name="modelNumber"]',
      type: 'text',
      required: true
    },
    firstName: {
      selector: '#firstName, input[name="firstName"]',
      type: 'text',
      required: true
    },
    lastName: {
      selector: '#lastName, input[name="lastName"]',
      type: 'text',
      required: true
    },
    email: {
      selector: '#email, input[name="email"], input[type="email"]',
      type: 'email',
      required: true
    },
    phone: {
      selector: '#phone, input[name="phone"], input[type="tel"]',
      type: 'tel',
      required: false
    }
  },

  whirlpool: {
    serialNumber: {
      selector: 'input[name="serialNumber"], #serialNumber',
      type: 'text',
      required: true
    },
    modelNumber: {
      selector: 'input[name="modelNumber"], #modelNumber',
      type: 'text',
      required: true
    },
    firstName: {
      selector: 'input[name="firstName"], #firstName',
      type: 'text',
      required: true
    },
    lastName: {
      selector: 'input[name="lastName"], #lastName',
      type: 'text',
      required: true
    },
    email: {
      selector: 'input[name="email"], input[type="email"]',
      type: 'email',
      required: true
    },
    phone: {
      selector: 'input[name="phone"], input[type="tel"]',
      type: 'tel',
      required: false
    },
    address: {
      selector: 'input[name="address"], input[name="address1"]',
      type: 'text',
      required: false
    },
    city: {
      selector: 'input[name="city"]',
      type: 'text',
      required: false
    },
    state: {
      selector: 'select[name="state"]',
      type: 'select',
      required: false
    },
    zipCode: {
      selector: 'input[name="zip"], input[name="zipCode"]',
      type: 'text',
      required: false
    }
  }
};

/**
 * Get form mappings for a manufacturer
 */
export function getFormMappings(manufacturer: string): FormFieldMapping | undefined {
  const normalized = manufacturer.toLowerCase().replace(/\s+/g, '');
  return FORM_MAPPINGS[normalized];
}

/**
 * Get all available manufacturer mappings
 */
export function getAvailableMappings(): string[] {
  return Object.keys(FORM_MAPPINGS);
}

