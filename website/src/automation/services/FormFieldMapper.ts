/**
 * Form Field Mapper
 * 
 * Maps registration data to form fields intelligently by matching field names,
 * types, and labels to registration data properties.
 */

import { RegistrationData } from '../core/BaseAutomation';

export interface DetectedField {
  name: string;
  selector: string;
  type: 'text' | 'email' | 'tel' | 'date' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio';
  label?: string;
  placeholder?: string;
  required?: boolean;
  fallbackSelectors?: string[];
}

export class FormFieldMapper {
  /**
   * Field name mappings - maps common form field names to registration data properties
   */
  private fieldNameMappings: Record<string, keyof RegistrationData> = {
    // Name fields
    'firstname': 'firstName',
    'first_name': 'firstName',
    'fname': 'firstName',
    'givenname': 'firstName',
    'lastname': 'lastName',
    'last_name': 'lastName',
    'lname': 'lastName',
    'surname': 'lastName',
    'familyname': 'lastName',

    // Contact fields
    'email': 'email',
    'emailaddress': 'email',
    'email_address': 'email',
    'phone': 'phone',
    'phonenumber': 'phone',
    'phone_number': 'phone',
    'telephone': 'phone',
    'mobile': 'phone',
    'cell': 'phone',

    // Address fields
    'address': 'address',
    'street': 'address',
    'streetaddress': 'address',
    'street_address': 'address',
    'address1': 'address',
    'addressline1': 'address',
    'city': 'city',
    'state': 'state',
    'province': 'state',
    'zip': 'zipCode',
    'zipcode': 'zipCode',
    'zip_code': 'zipCode',
    'postalcode': 'zipCode',
    'postal_code': 'zipCode',
    'country': 'country',

    // Product fields
    'productname': 'productName',
    'product_name': 'productName',
    'model': 'modelNumber',
    'modelnumber': 'modelNumber',
    'model_number': 'modelNumber',
    'serial': 'serialNumber',
    'serialnumber': 'serialNumber',
    'serial_number': 'serialNumber',
    'sku': 'sku',
    'upc': 'upc',
    'barcode': 'upc',

    // Purchase fields
    'purchasedate': 'purchaseDate',
    'purchase_date': 'purchaseDate',
    'dateofpurchase': 'purchaseDate',
    'date_of_purchase': 'purchaseDate',
    'purchaseprice': 'purchasePrice',
    'purchase_price': 'purchasePrice',
    'price': 'purchasePrice',
    'retailer': 'retailer',
    'store': 'retailer',
    'purchasedfrom': 'retailer',
    'purchased_from': 'retailer',

    // Manufacturer
    'manufacturer': 'manufacturerName',
    'manufacturername': 'manufacturerName',
    'manufacturer_name': 'manufacturerName',
    'brand': 'manufacturerName'
  };

  /**
   * Map registration data to detected form fields
   */
  mapDataToFields(
    data: RegistrationData,
    fields: DetectedField[]
  ): Map<string, { value: any; field: DetectedField }> {
    const mapped = new Map<string, { value: any; field: DetectedField }>();

    for (const field of fields) {
      const dataKey = this.findMatchingDataKey(field, data);
      if (dataKey) {
        const value = this.transformValue(data[dataKey], field);
        if (value !== null && value !== undefined) {
          mapped.set(field.name, { value, field });
        }
      }
    }

    return mapped;
  }

  /**
   * Find matching registration data key for a form field
   */
  private findMatchingDataKey(
    field: DetectedField,
    data: RegistrationData
  ): keyof RegistrationData | null {
    // Try exact match first
    const normalizedFieldName = this.normalizeFieldName(field.name);
    if (normalizedFieldName in this.fieldNameMappings) {
      const dataKey = this.fieldNameMappings[normalizedFieldName];
      if (data[dataKey]) {
        return dataKey;
      }
    }

    // Try matching against field name
    for (const [formFieldName, dataKey] of Object.entries(this.fieldNameMappings)) {
      if (normalizedFieldName.includes(formFieldName) || formFieldName.includes(normalizedFieldName)) {
        if (data[dataKey]) {
          return dataKey;
        }
      }
    }

    // Try matching against label
    if (field.label) {
      const normalizedLabel = this.normalizeFieldName(field.label);
      for (const [formFieldName, dataKey] of Object.entries(this.fieldNameMappings)) {
        if (normalizedLabel.includes(formFieldName) || formFieldName.includes(normalizedLabel)) {
          if (data[dataKey]) {
            return dataKey;
          }
        }
      }
    }

    // Try matching against placeholder
    if (field.placeholder) {
      const normalizedPlaceholder = this.normalizeFieldName(field.placeholder);
      for (const [formFieldName, dataKey] of Object.entries(this.fieldNameMappings)) {
        if (normalizedPlaceholder.includes(formFieldName) || formFieldName.includes(normalizedPlaceholder)) {
          if (data[dataKey]) {
            return dataKey;
          }
        }
      }
    }

    // Try type-based matching
    if (field.type === 'email' && data.email) {
      return 'email';
    }
    if (field.type === 'tel' && data.phone) {
      return 'phone';
    }
    if (field.type === 'date' && data.purchaseDate) {
      return 'purchaseDate';
    }

    return null;
  }

  /**
   * Normalize field name for matching
   */
  private normalizeFieldName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim();
  }

  /**
   * Transform value based on field type and requirements
   */
  private transformValue(value: any, field: DetectedField): any {
    if (value === null || value === undefined) {
      return null;
    }

    // Handle different field types
    switch (field.type) {
      case 'email':
        return String(value).toLowerCase().trim();

      case 'tel':
        return this.formatPhoneNumber(String(value));

      case 'date':
        return this.formatDate(String(value));

      case 'number':
        return Number(value);

      case 'checkbox':
      case 'radio':
        return Boolean(value);

      case 'text':
      case 'textarea':
      default:
        return String(value).trim();
    }
  }

  /**
   * Format phone number for form input
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');

    // Format as (XXX) XXX-XXXX if 10 digits
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }

    // Format as +1 (XXX) XXX-XXXX if 11 digits starting with 1
    if (digits.length === 11 && digits[0] === '1') {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }

    // Return as-is if not standard format
    return phone;
  }

  /**
   * Format date for form input
   */
  private formatDate(date: string): string {
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) {
        return date;
      }

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');

      // Return in YYYY-MM-DD format (HTML5 date input format)
      return `${year}-${month}-${day}`;
    } catch (error) {
      return date;
    }
  }
}

