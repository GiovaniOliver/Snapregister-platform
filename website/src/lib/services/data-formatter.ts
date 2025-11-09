/**
 * Data Formatting Service
 * Formats stored user/product data into common form field formats
 */

export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MM-DD-YYYY' | 'DD-MM-YYYY';
export type PhoneFormat = 'US' | 'INTERNATIONAL' | 'DASHES' | 'DOTS' | 'SPACES' | 'RAW';
export type AddressFormat = 'US_STANDARD' | 'SINGLE_LINE' | 'MULTI_LINE' | 'INTERNATIONAL';

interface FormatOptions {
  dateFormat?: DateFormat;
  phoneFormat?: PhoneFormat;
  addressFormat?: AddressFormat;
  includeCountryCode?: boolean;
}

export class DataFormatter {
  /**
   * Format date into various formats
   */
  static formatDate(date: Date | string | null | undefined, format: DateFormat = 'MM/DD/YYYY'): string {
    if (!date) return '';

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';

    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const year = dateObj.getFullYear();

    switch (format) {
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'MM-DD-YYYY':
        return `${month}-${day}-${year}`;
      case 'DD-MM-YYYY':
        return `${day}-${month}-${year}`;
      default:
        return `${month}/${day}/${year}`;
    }
  }

  /**
   * Format phone number into various formats
   */
  static formatPhone(phone: string | null | undefined, format: PhoneFormat = 'US', includeCountryCode: boolean = false): string {
    if (!phone) return '';

    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');

    if (digits.length === 0) return '';

    // Handle US phone numbers (10 digits)
    if (digits.length === 10 && format === 'US') {
      const countryCode = includeCountryCode ? '+1 ' : '';
      return `${countryCode}(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }

    // Handle US phone numbers with country code (11 digits starting with 1)
    if (digits.length === 11 && digits[0] === '1' && format === 'US') {
      const countryCode = includeCountryCode ? '+1 ' : '';
      return `${countryCode}(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }

    switch (format) {
      case 'US':
        if (digits.length === 10) {
          const countryCode = includeCountryCode ? '+1 ' : '';
          return `${countryCode}(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
        }
        break;

      case 'DASHES':
        if (digits.length === 10) {
          const countryCode = includeCountryCode ? '+1-' : '';
          return `${countryCode}${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
        }
        break;

      case 'DOTS':
        if (digits.length === 10) {
          const countryCode = includeCountryCode ? '+1.' : '';
          return `${countryCode}${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
        }
        break;

      case 'SPACES':
        if (digits.length === 10) {
          const countryCode = includeCountryCode ? '+1 ' : '';
          return `${countryCode}${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
        }
        break;

      case 'RAW':
        return digits;

      case 'INTERNATIONAL':
        // Format with country code and international standard
        if (digits.length >= 10) {
          const countryCode = digits.length === 11 && digits[0] === '1' ? '+1' : '+1';
          const number = digits.length === 11 && digits[0] === '1' ? digits.slice(1) : digits.slice(-10);
          return `${countryCode} ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
        }
        break;
    }

    // Fallback: return raw digits
    return digits;
  }

  /**
   * Format address into various formats
   */
  static formatAddress(
    address: string | null | undefined,
    city: string | null | undefined,
    state: string | null | undefined,
    zipCode: string | null | undefined,
    country: string | null | undefined,
    format: AddressFormat = 'US_STANDARD'
  ): string {
    const parts = {
      address: address || '',
      city: city || '',
      state: state || '',
      zipCode: zipCode || '',
      country: country || 'US'
    };

    switch (format) {
      case 'US_STANDARD':
        // 123 Main St, City, ST 12345
        if (!parts.address) return '';
        return [
          parts.address,
          parts.city && parts.state ? `${parts.city}, ${parts.state}` : (parts.city || parts.state),
          parts.zipCode
        ].filter(Boolean).join(', ');

      case 'SINGLE_LINE':
        // 123 Main St, City, ST 12345, USA
        return [parts.address, parts.city, parts.state, parts.zipCode, parts.country !== 'US' ? parts.country : '']
          .filter(Boolean)
          .join(', ');

      case 'MULTI_LINE':
        // 123 Main St
        // City, ST 12345
        // USA
        const lines = [];
        if (parts.address) lines.push(parts.address);
        if (parts.city || parts.state || parts.zipCode) {
          const cityStateLine = [
            parts.city,
            parts.state,
            parts.zipCode
          ].filter(Boolean).join(', ');
          if (cityStateLine) lines.push(cityStateLine);
        }
        if (parts.country && parts.country !== 'US') lines.push(parts.country);
        return lines.join('\n');

      case 'INTERNATIONAL':
        // Full address with country
        return [
          parts.address,
          parts.city,
          parts.state,
          parts.zipCode,
          parts.country
        ].filter(Boolean).join(', ');

      default:
        return parts.address || '';
    }
  }

  /**
   * Format serial number based on manufacturer requirements
   */
  static formatSerialNumber(serialNumber: string | null | undefined, manufacturer?: string): string {
    if (!serialNumber) return '';

    // Remove spaces and special characters for base formatting
    const cleaned = serialNumber.trim().toUpperCase();

    // Manufacturer-specific formatting rules
    if (manufacturer) {
      const normalizedManufacturer = manufacturer.toLowerCase();

      // Add manufacturer-specific rules here
      if (normalizedManufacturer.includes('samsung')) {
        // Samsung typically uses alphanumeric without spaces
        return cleaned.replace(/[\s-]/g, '');
      }

      if (normalizedManufacturer.includes('lg')) {
        // LG often uses format: XXX-XXXX-XXXX
        const digitsOnly = cleaned.replace(/[^A-Z0-9]/g, '');
        if (digitsOnly.length >= 9) {
          return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 7)}-${digitsOnly.slice(7)}`;
        }
      }

      if (normalizedManufacturer.includes('whirlpool')) {
        // Whirlpool uses continuous alphanumeric
        return cleaned.replace(/[\s-]/g, '');
      }

      if (normalizedManufacturer.includes('ge') || normalizedManufacturer.includes('general electric')) {
        // GE uses various formats, keep as-is
        return cleaned;
      }
    }

    // Default: return cleaned version
    return cleaned;
  }

  /**
   * Format full name into parts
   */
  static formatName(firstName: string | null | undefined, lastName: string | null | undefined): {
    full: string;
    first: string;
    last: string;
  } {
    const first = firstName?.trim() || '';
    const last = lastName?.trim() || '';
    return {
      full: [first, last].filter(Boolean).join(' '),
      first,
      last
    };
  }

  /**
   * Format price/currency
   */
  static formatPrice(price: number | null | undefined, includeCurrency: boolean = true): string {
    if (price === null || price === undefined) return '';

    const formatted = price.toFixed(2);
    return includeCurrency ? `$${formatted}` : formatted;
  }

  /**
   * Format all data for a registration form
   */
  static formatRegistrationData(
    userData: {
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
      phone?: string | null;
      address?: string | null;
      city?: string | null;
      state?: string | null;
      zipCode?: string | null;
      country?: string | null;
    },
    productData: {
      productName?: string | null;
      manufacturer?: string | null;
      modelNumber?: string | null;
      serialNumber?: string | null;
      purchaseDate?: Date | string | null;
      purchasePrice?: number | null;
      retailer?: string | null;
    },
    options: FormatOptions = {}
  ) {
    const {
      dateFormat = 'MM/DD/YYYY',
      phoneFormat = 'US',
      addressFormat = 'US_STANDARD',
      includeCountryCode = false
    } = options;

    const name = this.formatName(userData.firstName, userData.lastName);

    return {
      // Personal Information
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      fullName: name.full,
      email: userData.email || '',
      phone: this.formatPhone(userData.phone, phoneFormat, includeCountryCode),
      phoneRaw: this.formatPhone(userData.phone, 'RAW'),

      // Address
      address: userData.address || '',
      city: userData.city || '',
      state: userData.state || '',
      zipCode: userData.zipCode || '',
      country: userData.country || 'US',
      addressFormatted: this.formatAddress(
        userData.address,
        userData.city,
        userData.state,
        userData.zipCode,
        userData.country,
        addressFormat
      ),

      // Product Information
      productName: productData.productName || '',
      manufacturer: productData.manufacturer || '',
      modelNumber: productData.modelNumber || '',
      serialNumber: this.formatSerialNumber(productData.serialNumber, productData.manufacturer || undefined),
      serialNumberRaw: productData.serialNumber || '',
      purchaseDate: this.formatDate(productData.purchaseDate, dateFormat),
      purchaseDateISO: productData.purchaseDate ? new Date(productData.purchaseDate).toISOString().split('T')[0] : '',
      purchasePrice: this.formatPrice(productData.purchasePrice, true),
      purchasePriceRaw: this.formatPrice(productData.purchasePrice, false),
      retailer: productData.retailer || ''
    };
  }

  /**
   * Generate plain text format for copying
   */
  static toPlainText(data: ReturnType<typeof DataFormatter.formatRegistrationData>): string {
    return `PERSONAL INFORMATION
Name: ${data.fullName}
Email: ${data.email}
Phone: ${data.phone}
Address: ${data.addressFormatted}

PRODUCT INFORMATION
Product: ${data.productName}
Manufacturer: ${data.manufacturer}
Model Number: ${data.modelNumber}
Serial Number: ${data.serialNumber}
Purchase Date: ${data.purchaseDate}
Purchase Price: ${data.purchasePrice}
Retailer: ${data.retailer}`;
  }

  /**
   * Generate JSON format for copying
   */
  static toJSON(data: ReturnType<typeof DataFormatter.formatRegistrationData>): string {
    return JSON.stringify(data, null, 2);
  }
}
