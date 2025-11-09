/**
 * Warranty Service for SnapRegister Mobile App
 * Handles warranty-related API requests
 */

import { api, uploadFile } from './api';
import { API_ENDPOINTS } from '../config/api';
import { Warranty, ApiResponse } from '../types';

interface WarrantiesResponse {
  success: boolean;
  warranties: any[];
  count: number;
}

/**
 * Warranty Service
 */
export const warrantyService = {
  /**
   * Get all warranties for the current user
   *
   * @returns Array of warranties
   */
  getWarranties: async (): Promise<Warranty[]> => {
    try {
      const response = await api.get<WarrantiesResponse>(API_ENDPOINTS.WARRANTIES.LIST);

      const warranties = response.data.warranties || [];

      if (__DEV__) {
        console.log('[Warranties] Fetched warranties:', warranties.length);
      }

      return warranties;
    } catch (error: any) {
      if (__DEV__) {
        console.error('[Warranties] Error fetching warranties:', error.message);
      }
      throw new Error(error.message || 'Failed to fetch warranties');
    }
  },

  /**
   * Get single warranty by ID
   *
   * @param id - Warranty ID
   * @returns Warranty data
   */
  getWarrantyById: async (id: string): Promise<Warranty> => {
    try {
      const response = await api.get<ApiResponse<Warranty>>(
        API_ENDPOINTS.WARRANTIES.BY_ID(id)
      );

      if (!response.data.data) {
        throw new Error('Warranty not found');
      }

      if (__DEV__) {
        console.log('[Warranties] Fetched warranty:', id);
      }

      return response.data.data;
    } catch (error: any) {
      if (__DEV__) {
        console.error('[Warranties] Error fetching warranty:', error.message);
      }
      throw new Error(error.message || 'Failed to fetch warranty');
    }
  },

  /**
   * Get warranties for a specific product
   *
   * @param productId - Product ID
   * @returns Array of warranties for the product
   */
  getProductWarranties: async (productId: string): Promise<Warranty[]> => {
    try {
      const response = await api.get<ApiResponse<Warranty[]>>(
        API_ENDPOINTS.PRODUCTS.WARRANTIES(productId)
      );

      const warranties = response.data.data || [];

      if (__DEV__) {
        console.log('[Warranties] Fetched product warranties:', warranties.length);
      }

      return warranties;
    } catch (error: any) {
      if (__DEV__) {
        console.error('[Warranties] Error fetching product warranties:', error.message);
      }
      throw new Error(error.message || 'Failed to fetch product warranties');
    }
  },

  /**
   * Create new warranty
   *
   * @param warrantyData - Warranty data to create
   * @returns Created warranty
   */
  createWarranty: async (warrantyData: Partial<Warranty>): Promise<Warranty> => {
    try {
      const response = await api.post<ApiResponse<Warranty>>(
        API_ENDPOINTS.WARRANTIES.CREATE,
        warrantyData
      );

      if (!response.data.data) {
        throw new Error('Failed to create warranty');
      }

      if (__DEV__) {
        console.log('[Warranties] Created warranty:', response.data.data);
      }

      return response.data.data;
    } catch (error: any) {
      if (__DEV__) {
        console.error('[Warranties] Error creating warranty:', error.message);
      }
      throw new Error(error.message || 'Failed to create warranty');
    }
  },

  /**
   * Update existing warranty
   *
   * @param id - Warranty ID
   * @param warrantyData - Updated warranty data
   * @returns Updated warranty
   */
  updateWarranty: async (id: string, warrantyData: Partial<Warranty>): Promise<Warranty> => {
    try {
      const response = await api.put<ApiResponse<Warranty>>(
        API_ENDPOINTS.WARRANTIES.UPDATE(id),
        warrantyData
      );

      if (!response.data.data) {
        throw new Error('Failed to update warranty');
      }

      if (__DEV__) {
        console.log('[Warranties] Updated warranty:', id);
      }

      return response.data.data;
    } catch (error: any) {
      if (__DEV__) {
        console.error('[Warranties] Error updating warranty:', error.message);
      }
      throw new Error(error.message || 'Failed to update warranty');
    }
  },

  /**
   * Delete warranty
   *
   * @param id - Warranty ID
   */
  deleteWarranty: async (id: string): Promise<void> => {
    try {
      await api.delete(API_ENDPOINTS.WARRANTIES.DELETE(id));

      if (__DEV__) {
        console.log('[Warranties] Deleted warranty:', id);
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('[Warranties] Error deleting warranty:', error.message);
      }
      throw new Error(error.message || 'Failed to delete warranty');
    }
  },

  /**
   * Upload warranty document
   *
   * @param warrantyId - Warranty ID
   * @param documentUri - Local document URI
   * @returns Document URL
   */
  uploadWarrantyDocument: async (warrantyId: string, documentUri: string): Promise<string> => {
    try {
      const fileName = `warranty_${warrantyId}_${Date.now()}.pdf`;
      const response = await uploadFile(
        `${API_ENDPOINTS.WARRANTIES.BY_ID(warrantyId)}/document`,
        documentUri,
        fileName,
        'document'
      );

      if (__DEV__) {
        console.log('[Warranties] Uploaded document for warranty:', warrantyId);
      }

      return response.data.data.documentUrl;
    } catch (error: any) {
      if (__DEV__) {
        console.error('[Warranties] Error uploading document:', error.message);
      }
      throw new Error(error.message || 'Failed to upload document');
    }
  },

  /**
   * Get active warranties
   *
   * @returns Array of active warranties
   */
  getActiveWarranties: async (): Promise<Warranty[]> => {
    try {
      const response = await api.get<ApiResponse<Warranty[]>>(
        `${API_ENDPOINTS.WARRANTIES.LIST}?status=active`
      );

      const warranties = response.data.data || [];

      if (__DEV__) {
        console.log('[Warranties] Fetched active warranties:', warranties.length);
      }

      return warranties;
    } catch (error: any) {
      if (__DEV__) {
        console.error('[Warranties] Error fetching active warranties:', error.message);
      }
      throw new Error(error.message || 'Failed to fetch active warranties');
    }
  },

  /**
   * Get expiring warranties (within next N days)
   *
   * @param days - Number of days (default: 30)
   * @returns Array of expiring warranties
   */
  getExpiringWarranties: async (days: number = 30): Promise<Warranty[]> => {
    try {
      const response = await api.get<ApiResponse<Warranty[]>>(
        `${API_ENDPOINTS.WARRANTIES.LIST}?expiring=${days}`
      );

      const warranties = response.data.data || [];

      if (__DEV__) {
        console.log('[Warranties] Fetched expiring warranties:', warranties.length);
      }

      return warranties;
    } catch (error: any) {
      if (__DEV__) {
        console.error('[Warranties] Error fetching expiring warranties:', error.message);
      }
      throw new Error(error.message || 'Failed to fetch expiring warranties');
    }
  },

  /**
   * Analyze warranty from image
   *
   * @param imageUri - Local image URI
   * @returns Extracted warranty data
   */
  analyzeWarranty: async (imageUri: string): Promise<any> => {
    try {
      const fileName = `warranty_analysis_${Date.now()}.jpg`;
      const response = await uploadFile(
        API_ENDPOINTS.WARRANTIES.ANALYZE,
        imageUri,
        fileName,
        'image'
      );

      if (__DEV__) {
        console.log('[Warranties] Analyzed warranty image');
      }

      return response.data;
    } catch (error: any) {
      if (__DEV__) {
        console.error('[Warranties] Error analyzing warranty:', error.message);
      }
      throw new Error(error.message || 'Failed to analyze warranty');
    }
  },
};

export default warrantyService;
