// Validation utility functions

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isValidSerialNumber = (serialNumber: string): boolean => {
  return serialNumber.trim().length >= 3;
};

export const validateProductData = (data: {
  name?: string;
  brand?: string;
  model?: string;
  purchaseDate?: Date | string;
}): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push('Product name is required');
  }

  if (!data.brand || data.brand.trim().length === 0) {
    errors.push('Brand is required');
  }

  if (!data.model || data.model.trim().length === 0) {
    errors.push('Model is required');
  }

  if (!data.purchaseDate) {
    errors.push('Purchase date is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const validateWarrantyData = (data: {
  provider?: string;
  startDate?: Date | string;
  endDate?: Date | string;
}): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.provider || data.provider.trim().length === 0) {
    errors.push('Warranty provider is required');
  }

  if (!data.startDate) {
    errors.push('Start date is required');
  }

  if (!data.endDate) {
    errors.push('End date is required');
  }

  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (start >= end) {
      errors.push('End date must be after start date');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
