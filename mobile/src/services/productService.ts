/**
 * Product Service for SnapRegister Mobile App
 * Handles product-related API requests with proper data mapping
 */

import { api, uploadFile } from './api';
import { API_ENDPOINTS } from '../config/api';
import { Product, ApiResponse, PaginatedResponse } from '../types';

/**
 * Helper function to safely convert dates to ISO strings
 */
const toIsoString = (value: any, fallback: string): string => {
  if (!value) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) {
    return fallback;
  }
  return date.toISOString();
};

/**
 * Map backend API product response to mobile Product type
 */
const mapApiProductToMobile = (product: any): Product => {
  if (!product) {
    const fallbackDate = new Date().toISOString();
    return {
      id: `product-${fallbackDate}`,
      userId: '',
      name: 'Unknown Product',
      brand: 'Unknown',
      model: '',
      category: 'Uncategorized',
      purchaseDate: fallbackDate,
      createdAt: fallbackDate,
      updatedAt: fallbackDate,
    };
  }

  const purchaseDate = toIsoString(product.purchaseDate, new Date().toISOString());
  const createdAt = toIsoString(product.createdAt, purchaseDate);
  const updatedAt = toIsoString(product.updatedAt, createdAt);

  // Handle imageUrls array or single imageUrl
  const imageUrl = Array.isArray(product.imageUrls)
    ? product.imageUrls[0]
    : product.imageUrl;

  return {
    id: product.id ?? `product-${Date.now()}`,
    userId: product.userId ?? '',
    name: product.productName ?? product.name ?? 'Unknown Product',
    brand: product.manufacturerName ?? product.brand ?? 'Unknown',
    model: product.modelNumber ?? product.model ?? '',
    serialNumber: product.serialNumber ?? undefined,
    category: product.category ?? 'Uncategorized',
    purchaseDate,
    purchasePrice: product.purchasePrice ?? undefined,
    retailer: product.retailer ?? undefined,
    imageUrl,
    notes: product.notes ?? product.additionalInfo ?? undefined,
    createdAt,
    updatedAt,
  };
};

/**
 * Map backend pagination response to mobile pagination format
 */
const mapPagination = (pagination: any, fallbackLength = 0) => ({
  page: pagination?.page ?? 1,
  pageSize: pagination?.limit ?? pagination?.pageSize ?? fallbackLength,
  total: pagination?.totalCount ?? pagination?.total ?? fallbackLength,
  totalPages: pagination?.totalPages ?? 1,
});

/**
 * Product Service
 */
export const productService = {
  /**
   * Get all products for current user with pagination
   *
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 20)
   * @returns Paginated list of products
   */
  getProducts: async (page = 1, limit = 20): Promise<PaginatedResponse<Product>> => {
    try {
      const response = await api.get<any>(
        `${API_ENDPOINTS.PRODUCTS.LIST}?page=${page}&limit=${limit}`
      );
      const payload = response.data;

      const productsArray = Array.isArray(payload?.data) ? payload.data : [];

      if (__DEV__) {
        console.log('[Products] Fetched products:', productsArray.length);
      }

      return {
        data: productsArray.map(mapApiProductToMobile),
        pagination: mapPagination(payload?.pagination, productsArray.length),
      };
    } catch (error: any) {
      if (__DEV__) {
        console.error('[Products] Error fetching products:', error.message);
      }
      throw new Error(error.message || 'Failed to fetch products');
    }
  },

  /**
   * Get single product by ID
   *
   * @param id - Product ID
   * @returns Product data
   */
  getProductById: async (id: string): Promise<Product> => {
    try {
      const response = await api.get<ApiResponse<Product>>(
        API_ENDPOINTS.PRODUCTS.BY_ID(id)
      );

      if (!response.data.data) {
        throw new Error('Product not found');
      }

      if (__DEV__) {
        console.log('[Products] Fetched product:', id);
      }

      return mapApiProductToMobile(response.data.data);
    } catch (error: any) {
      if (__DEV__) {
        console.error('[Products] Error fetching product:', error.message);
      }
      throw new Error(error.message || 'Failed to fetch product');
    }
  },

  /**
   * Create new product
   *
   * @param productData - Product data to create
   * @returns Created product
   */
  createProduct: async (productData: Partial<Product>): Promise<Product> => {
    try {
      const response = await api.post<ApiResponse<Product>>(
        API_ENDPOINTS.PRODUCTS.CREATE,
        productData
      );

      if (!response.data.data) {
        throw new Error(response.data.error || 'Failed to create product');
      }

      if (__DEV__) {
        console.log('[Products] Created product:', response.data.data);
      }

      return mapApiProductToMobile(response.data.data);
    } catch (error: any) {
      if (__DEV__) {
        console.error('[Products] Error creating product:', error.message);
      }
      throw new Error(error.message || 'Failed to create product');
    }
  },

  /**
   * Update existing product
   *
   * @param id - Product ID
   * @param productData - Updated product data
   * @returns Updated product
   */
  updateProduct: async (id: string, productData: Partial<Product>): Promise<Product> => {
    try {
      const response = await api.put<ApiResponse<Product>>(
        API_ENDPOINTS.PRODUCTS.UPDATE(id),
        productData
      );

      if (!response.data.data) {
        throw new Error(response.data.error || 'Failed to update product');
      }

      if (__DEV__) {
        console.log('[Products] Updated product:', id);
      }

      return mapApiProductToMobile(response.data.data);
    } catch (error: any) {
      if (__DEV__) {
        console.error('[Products] Error updating product:', error.message);
      }
      throw new Error(error.message || 'Failed to update product');
    }
  },

  /**
   * Delete product
   *
   * @param id - Product ID
   */
  deleteProduct: async (id: string): Promise<void> => {
    try {
      await api.delete(API_ENDPOINTS.PRODUCTS.DELETE(id));

      if (__DEV__) {
        console.log('[Products] Deleted product:', id);
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('[Products] Error deleting product:', error.message);
      }
      throw new Error(error.message || 'Failed to delete product');
    }
  },

  /**
   * Upload product image
   *
   * @param productId - Product ID
   * @param imageUri - Local image URI
   * @returns Image URL
   */
  uploadProductImage: async (productId: string, imageUri: string): Promise<string> => {
    try {
      const fileName = `product_${productId}_${Date.now()}.jpg`;
      const response = await uploadFile(
        `${API_ENDPOINTS.PRODUCTS.BY_ID(productId)}/image`,
        imageUri,
        fileName
      );

      if (__DEV__) {
        console.log('[Products] Uploaded image for product:', productId);
      }

      return response.data.data.imageUrl;
    } catch (error: any) {
      if (__DEV__) {
        console.error('[Products] Error uploading image:', error.message);
      }
      throw new Error(error.message || 'Failed to upload image');
    }
  },

  /**
   * Search products
   *
   * @param query - Search query string
   * @returns Array of matching products
   */
  searchProducts: async (query: string): Promise<Product[]> => {
    try {
      const response = await api.get<ApiResponse<Product[]>>(
        `${API_ENDPOINTS.PRODUCTS.LIST}/search?q=${encodeURIComponent(query)}`
      );

      const products = response.data.data || [];

      if (__DEV__) {
        console.log('[Products] Search results:', products.length);
      }

      return products.map(mapApiProductToMobile);
    } catch (error: any) {
      if (__DEV__) {
        console.error('[Products] Error searching products:', error.message);
      }
      throw new Error(error.message || 'Failed to search products');
    }
  },

  /**
   * Get products by category
   *
   * @param category - Product category
   * @returns Array of products in the category
   */
  getProductsByCategory: async (category: string): Promise<Product[]> => {
    try {
      const response = await api.get<ApiResponse<Product[]>>(
        `${API_ENDPOINTS.PRODUCTS.LIST}?category=${encodeURIComponent(category)}`
      );

      const products = response.data.data || [];

      if (__DEV__) {
        console.log('[Products] Products in category:', category, products.length);
      }

      return products.map(mapApiProductToMobile);
    } catch (error: any) {
      if (__DEV__) {
        console.error('[Products] Error fetching products by category:', error.message);
      }
      throw new Error(error.message || 'Failed to fetch products');
    }
  },
};

export default productService;
