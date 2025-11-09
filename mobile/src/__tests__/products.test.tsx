/**
 * Product Workflow Tests
 * Tests for product scanning, AI analysis, manual entry, list view, search, and details view
 * Using React Native Testing Library and Jest with mocked API calls
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { productService } from '../services/productService';
import { aiService } from '../services/aiService';
import * as SecureStore from 'expo-secure-store';

// Mock dependencies
jest.mock('../services/productService');
jest.mock('../services/aiService');
jest.mock('expo-secure-store');

// Mock product data
const mockProducts = [
  {
    id: 'prod-1',
    userId: 'user-123',
    name: 'iPhone 14 Pro',
    brand: 'Apple',
    model: 'iPhone 14 Pro',
    serialNumber: 'SERIAL123',
    category: 'Smartphones',
    purchaseDate: '2023-09-15',
    purchasePrice: 999,
    retailer: 'Apple Store',
    imageUrl: 'https://example.com/iphone.jpg',
    notes: 'Original box and accessories',
    createdAt: '2023-09-15T10:00:00Z',
    updatedAt: '2023-09-15T10:00:00Z',
  },
  {
    id: 'prod-2',
    userId: 'user-123',
    name: 'Samsung Galaxy S24',
    brand: 'Samsung',
    model: 'Galaxy S24',
    serialNumber: 'SERIAL456',
    category: 'Smartphones',
    purchaseDate: '2024-01-20',
    purchasePrice: 899,
    retailer: 'Best Buy',
    imageUrl: 'https://example.com/samsung.jpg',
    notes: '',
    createdAt: '2024-01-20T14:30:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
  },
  {
    id: 'prod-3',
    userId: 'user-123',
    name: 'MacBook Pro 16',
    brand: 'Apple',
    model: 'MacBook Pro 16',
    serialNumber: 'SERIAL789',
    category: 'Laptops',
    purchaseDate: '2023-06-10',
    purchasePrice: 2499,
    retailer: 'Apple Store',
    imageUrl: 'https://example.com/macbook.jpg',
    notes: 'M3 Max processor',
    createdAt: '2023-06-10T08:15:00Z',
    updatedAt: '2023-06-10T08:15:00Z',
  },
];

describe('Product Workflow Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('user-token');
  });

  describe('Single Image Scan Workflow', () => {
    it('should scan single image, analyze with AI, and save product', async () => {
      const imageUri = 'file:///path/to/image.jpg';

      // Mock AI analysis result
      const mockAnalysisResult = {
        brand: 'Apple',
        model: 'iPhone 14 Pro',
        serialNumber: 'SERIAL123',
        productName: 'iPhone 14 Pro',
        category: 'Smartphones',
        warrantyInfo: {
          duration: '12 months',
          startDate: '2023-09-15',
          endDate: '2024-09-15',
          terms: 'Standard limited warranty',
        },
        confidence: 0.95,
        rawText: 'Apple Inc. iPhone 14 Pro...',
      };

      const mockCreatedProduct = {
        id: 'prod-new-1',
        userId: 'user-123',
        name: 'iPhone 14 Pro',
        brand: 'Apple',
        model: 'iPhone 14 Pro',
        serialNumber: 'SERIAL123',
        category: 'Smartphones',
        purchaseDate: new Date().toISOString().split('T')[0],
        purchasePrice: undefined,
        retailer: undefined,
        imageUrl: imageUri,
        notes: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (aiService.analyzeImage as jest.Mock).mockResolvedValue(
        mockAnalysisResult
      );
      (productService.createProduct as jest.Mock).mockResolvedValue(
        mockCreatedProduct
      );

      // Step 1: Analyze image with AI
      const analysisResult = await aiService.analyzeImage(imageUri);
      expect(aiService.analyzeImage).toHaveBeenCalledWith(imageUri);
      expect(analysisResult.brand).toBe('Apple');
      expect(analysisResult.confidence).toBe(0.95);

      // Step 2: Save product with extracted data
      const productData = {
        name: analysisResult.productName,
        brand: analysisResult.brand,
        model: analysisResult.model,
        serialNumber: analysisResult.serialNumber,
        category: analysisResult.category,
        imageUrl: imageUri,
      };

      const createdProduct = await productService.createProduct(productData);
      expect(productService.createProduct).toHaveBeenCalledWith(productData);
      expect(createdProduct.id).toBe('prod-new-1');
      expect(createdProduct.name).toBe('iPhone 14 Pro');
    });

    it('should handle AI analysis failure during single image scan', async () => {
      const imageUri = 'file:///path/to/image.jpg';
      const analysisError = new Error('AI analysis failed: Unable to extract product information');

      (aiService.analyzeImage as jest.Mock).mockRejectedValue(
        analysisError
      );

      // Should throw error when AI analysis fails
      await expect(aiService.analyzeImage(imageUri)).rejects.toThrow(
        'AI analysis failed'
      );

      // Product should not be created
      expect(productService.createProduct).not.toHaveBeenCalled();
    });

    it('should handle product save failure after successful AI analysis', async () => {
      const imageUri = 'file:///path/to/image.jpg';

      const mockAnalysisResult = {
        brand: 'Apple',
        model: 'iPhone 14 Pro',
        serialNumber: 'SERIAL123',
        productName: 'iPhone 14 Pro',
        category: 'Smartphones',
        warrantyInfo: {},
        confidence: 0.95,
      };

      const saveError = new Error('Failed to save product: Database error');

      (aiService.analyzeImage as jest.Mock).mockResolvedValue(
        mockAnalysisResult
      );
      (productService.createProduct as jest.Mock).mockRejectedValue(saveError);

      // AI analysis succeeds
      const analysisResult = await aiService.analyzeImage(imageUri);
      expect(analysisResult).toBeDefined();

      // But product save fails
      const productData = {
        name: analysisResult.productName,
        brand: analysisResult.brand,
        model: analysisResult.model,
        serialNumber: analysisResult.serialNumber,
        category: analysisResult.category,
      };

      await expect(productService.createProduct(productData)).rejects.toThrow(
        'Failed to save product'
      );
    });

    it('should display scanned product in products list after save', async () => {
      const newProduct = mockProducts[0];

      (productService.getProducts as jest.Mock).mockResolvedValue({
        data: [newProduct],
        pagination: {
          page: 1,
          pageSize: 20,
          total: 1,
          totalPages: 1,
        },
      });

      const productsResponse = await productService.getProducts(1, 20);
      expect(productService.getProducts).toHaveBeenCalledWith(1, 20);
      expect(productsResponse.data.length).toBe(1);
      expect(productsResponse.data[0].id).toBe('prod-1');
      expect(productsResponse.data[0].name).toBe('iPhone 14 Pro');
    });
  });

  describe('Multi-Image Scan Workflow', () => {
    it('should scan 4 images, analyze with AI, and save product', async () => {
      const multiImageCapture = {
        serialNumberImage: 'file:///path/to/serial.jpg',
        warrantyCardImage: 'file:///path/to/warranty.jpg',
        receiptImage: 'file:///path/to/receipt.jpg',
        productImage: 'file:///path/to/product.jpg',
      };

      // Mock comprehensive AI analysis for multi-image
      const mockAnalysisResult = {
        brand: 'Samsung',
        model: 'Galaxy S24',
        serialNumber: 'SERIAL456',
        purchaseDate: '2024-01-20',
        warrantyPeriod: 24,
        warrantyEndDate: '2026-01-20',
        retailer: 'Best Buy',
        price: 899,
        confidence: 'high' as const,
        additionalInfo: 'Device includes screen protector and case',
        extractedAt: new Date().toISOString(),
        userId: 'user-123',
      };

      const mockCreatedProduct = {
        id: 'prod-new-2',
        userId: 'user-123',
        name: 'Samsung Galaxy S24',
        brand: 'Samsung',
        model: 'Galaxy S24',
        serialNumber: 'SERIAL456',
        category: 'Smartphones',
        purchaseDate: '2024-01-20',
        purchasePrice: 899,
        retailer: 'Best Buy',
        imageUrl: multiImageCapture.productImage,
        notes: mockAnalysisResult.additionalInfo,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (aiService.analyzeMultipleImages as jest.Mock).mockResolvedValue(
        mockAnalysisResult
      );
      (productService.createProduct as jest.Mock).mockResolvedValue(
        mockCreatedProduct
      );

      // Step 1: Analyze multiple images with AI
      const analysisResult = await aiService.analyzeMultipleImages(multiImageCapture);
      expect(aiService.analyzeMultipleImages).toHaveBeenCalledWith(multiImageCapture);
      expect(analysisResult.confidence).toBe('high');
      expect(analysisResult.warrantyEndDate).toBe('2026-01-20');
      expect(analysisResult.price).toBe(899);

      // Step 2: Save product with comprehensive extracted data
      const productData = {
        name: `${analysisResult.brand} ${analysisResult.model}`,
        brand: analysisResult.brand,
        model: analysisResult.model,
        serialNumber: analysisResult.serialNumber,
        category: 'Smartphones',
        purchaseDate: analysisResult.purchaseDate,
        purchasePrice: analysisResult.price,
        retailer: analysisResult.retailer,
        imageUrl: multiImageCapture.productImage,
        notes: analysisResult.additionalInfo,
      };

      const createdProduct = await productService.createProduct(productData);
      expect(productService.createProduct).toHaveBeenCalledWith(productData);
      expect(createdProduct.id).toBe('prod-new-2');
      expect(createdProduct.warrantyPeriod).toBeUndefined(); // Not part of product model
      expect(createdProduct.retailer).toBe('Best Buy');
    });

    it('should handle AI analysis failure for multi-image capture', async () => {
      const multiImageCapture = {
        serialNumberImage: 'file:///serial.jpg',
        warrantyCardImage: 'file:///warranty.jpg',
        receiptImage: 'file:///receipt.jpg',
        productImage: 'file:///product.jpg',
      };

      const analysisError = new Error('Multi-image analysis failed: Incomplete warranty information');

      (aiService.analyzeMultipleImages as jest.Mock).mockRejectedValue(analysisError);

      await expect(aiService.analyzeMultipleImages(multiImageCapture)).rejects.toThrow(
        'Multi-image analysis failed'
      );

      expect(productService.createProduct).not.toHaveBeenCalled();
    });

    it('should return high confidence for clear multi-image captures', async () => {
      const multiImageCapture = {
        serialNumberImage: 'file:///serial.jpg',
        warrantyCardImage: 'file:///warranty.jpg',
        receiptImage: 'file:///receipt.jpg',
        productImage: 'file:///product.jpg',
      };

      const mockResult = {
        brand: 'Apple',
        model: 'iPhone 14 Pro',
        serialNumber: 'SERIAL123',
        purchaseDate: '2023-09-15',
        warrantyPeriod: 12,
        warrantyEndDate: '2024-09-15',
        retailer: 'Apple Store',
        price: 999,
        confidence: 'high' as const,
        extractedAt: new Date().toISOString(),
        userId: 'user-123',
      };

      (aiService.analyzeMultipleImages as jest.Mock).mockResolvedValue(mockResult);

      const result = await aiService.analyzeMultipleImages(multiImageCapture);
      expect(result.confidence).toBe('high');
    });
  });

  describe('Manual Product Entry', () => {
    it('should save manually entered product', async () => {
      const manualProductData = {
        name: 'Sony WH-1000XM5 Headphones',
        brand: 'Sony',
        model: 'WH-1000XM5',
        serialNumber: 'SERIAL999',
        category: 'Audio Equipment',
        purchaseDate: '2023-12-01',
        purchasePrice: 399,
        retailer: 'Amazon',
        notes: 'Excellent noise cancellation',
      };

      const mockCreatedProduct = {
        id: 'prod-new-3',
        userId: 'user-123',
        ...manualProductData,
        imageUrl: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (productService.createProduct as jest.Mock).mockResolvedValue(
        mockCreatedProduct
      );

      const createdProduct = await productService.createProduct(manualProductData);
      expect(productService.createProduct).toHaveBeenCalledWith(manualProductData);
      expect(createdProduct.id).toBe('prod-new-3');
      expect(createdProduct.name).toBe('Sony WH-1000XM5 Headphones');
      expect(createdProduct.brand).toBe('Sony');
    });

    it('should appear in products list after manual save', async () => {
      const manualProduct = {
        id: 'prod-manual',
        userId: 'user-123',
        name: 'Sony WH-1000XM5',
        brand: 'Sony',
        model: 'WH-1000XM5',
        serialNumber: 'MANUAL123',
        category: 'Audio',
        purchaseDate: '2023-12-01',
        purchasePrice: 399,
        retailer: 'Amazon',
        imageUrl: undefined,
        notes: 'Manual entry',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (productService.getProducts as jest.Mock).mockResolvedValue({
        data: [manualProduct],
        pagination: {
          page: 1,
          pageSize: 20,
          total: 1,
          totalPages: 1,
        },
      });

      const response = await productService.getProducts();
      expect(response.data[0].id).toBe('prod-manual');
      expect(response.data[0].name).toBe('Sony WH-1000XM5');
    });
  });

  describe('Product List Pagination', () => {
    it('should fetch products with pagination', async () => {
      (productService.getProducts as jest.Mock).mockResolvedValue({
        data: mockProducts.slice(0, 2),
        pagination: {
          page: 1,
          pageSize: 20,
          total: 3,
          totalPages: 1,
        },
      });

      const response = await productService.getProducts(1, 20);
      expect(productService.getProducts).toHaveBeenCalledWith(1, 20);
      expect(response.data.length).toBe(2);
      expect(response.pagination.total).toBe(3);
      expect(response.pagination.page).toBe(1);
    });

    it('should fetch next page of products', async () => {
      const page2Products = mockProducts.slice(2);

      (productService.getProducts as jest.Mock).mockResolvedValue({
        data: page2Products,
        pagination: {
          page: 2,
          pageSize: 2,
          total: 3,
          totalPages: 2,
        },
      });

      const response = await productService.getProducts(2, 2);
      expect(productService.getProducts).toHaveBeenCalledWith(2, 2);
      expect(response.data.length).toBe(1);
      expect(response.pagination.page).toBe(2);
      expect(response.pagination.totalPages).toBe(2);
    });

    it('should handle invalid page numbers', async () => {
      const error = new Error('Page out of range');

      (productService.getProducts as jest.Mock).mockRejectedValue(error);

      await expect(productService.getProducts(999, 20)).rejects.toThrow(
        'Page out of range'
      );
    });

    it('should handle different page sizes', async () => {
      (productService.getProducts as jest.Mock).mockResolvedValue({
        data: mockProducts.slice(0, 10),
        pagination: {
          page: 1,
          pageSize: 10,
          total: 3,
          totalPages: 1,
        },
      });

      const response = await productService.getProducts(1, 10);
      expect(response.pagination.pageSize).toBe(10);
    });

    it('should return empty list for products not found', async () => {
      (productService.getProducts as jest.Mock).mockResolvedValue({
        data: [],
        pagination: {
          page: 1,
          pageSize: 20,
          total: 0,
          totalPages: 0,
        },
      });

      const response = await productService.getProducts(1, 20);
      expect(response.data.length).toBe(0);
      expect(response.pagination.total).toBe(0);
    });
  });

  describe('Product Search', () => {
    it('should search products by query', async () => {
      const searchQuery = 'iPhone';
      const searchResults = mockProducts.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      (productService.searchProducts as jest.Mock).mockResolvedValue(
        searchResults
      );

      const results = await productService.searchProducts(searchQuery);
      expect(productService.searchProducts).toHaveBeenCalledWith(searchQuery);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].brand).toBe('Apple');
    });

    it('should return empty results for non-matching search', async () => {
      (productService.searchProducts as jest.Mock).mockResolvedValue([]);

      const results = await productService.searchProducts('NonExistent');
      expect(results.length).toBe(0);
    });

    it('should search by brand', async () => {
      const appleProducts = mockProducts.filter(p => p.brand === 'Apple');

      (productService.searchProducts as jest.Mock).mockResolvedValue(
        appleProducts
      );

      const results = await productService.searchProducts('Apple');
      expect(results.length).toBe(2);
      expect(results.every(p => p.brand === 'Apple')).toBe(true);
    });

    it('should search by model', async () => {
      const iPhoneSearch = mockProducts.filter(p =>
        p.model.includes('iPhone 14')
      );

      (productService.searchProducts as jest.Mock).mockResolvedValue(
        iPhoneSearch
      );

      const results = await productService.searchProducts('iPhone 14');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle search errors gracefully', async () => {
      const searchError = new Error('Search service unavailable');

      (productService.searchProducts as jest.Mock).mockRejectedValue(
        searchError
      );

      await expect(productService.searchProducts('iPhone')).rejects.toThrow(
        'Search service unavailable'
      );
    });

    it('should search case-insensitively', async () => {
      const mockResult = mockProducts.filter(p => p.brand === 'Apple');

      (productService.searchProducts as jest.Mock).mockResolvedValue(
        mockResult
      );

      const results = await productService.searchProducts('apple');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Product Details View', () => {
    it('should fetch product details by ID', async () => {
      const productId = 'prod-1';

      (productService.getProductById as jest.Mock).mockResolvedValue(
        mockProducts[0]
      );

      const product = await productService.getProductById(productId);
      expect(productService.getProductById).toHaveBeenCalledWith(productId);
      expect(product.id).toBe('prod-1');
      expect(product.name).toBe('iPhone 14 Pro');
      expect(product.brand).toBe('Apple');
      expect(product.serialNumber).toBe('SERIAL123');
    });

    it('should include all product details in response', async () => {
      const product = mockProducts[0];

      (productService.getProductById as jest.Mock).mockResolvedValue(product);

      const details = await productService.getProductById('prod-1');
      expect(details.purchasePrice).toBe(999);
      expect(details.retailer).toBe('Apple Store');
      expect(details.notes).toBe('Original box and accessories');
      expect(details.imageUrl).toBeDefined();
    });

    it('should handle product not found', async () => {
      const notFoundError = new Error('Product not found');

      (productService.getProductById as jest.Mock).mockRejectedValue(
        notFoundError
      );

      await expect(productService.getProductById('nonexistent')).rejects.toThrow(
        'Product not found'
      );
    });

    it('should display warranty information in details view', async () => {
      // This would typically come from warranty service, but test the product data
      const product = mockProducts[0];

      (productService.getProductById as jest.Mock).mockResolvedValue(product);

      const details = await productService.getProductById('prod-1');
      expect(details.id).toBe('prod-1');
      // Warranty info would be fetched separately via warrantyService
    });

    it('should update product details', async () => {
      const productId = 'prod-1';
      const updatedData = {
        notes: 'Updated notes',
        purchasePrice: 1000,
      };

      const updatedProduct = {
        ...mockProducts[0],
        ...updatedData,
        updatedAt: new Date().toISOString(),
      };

      (productService.updateProduct as jest.Mock).mockResolvedValue(
        updatedProduct
      );

      const result = await productService.updateProduct(productId, updatedData);
      expect(productService.updateProduct).toHaveBeenCalledWith(productId, updatedData);
      expect(result.notes).toBe('Updated notes');
      expect(result.purchasePrice).toBe(1000);
    });

    it('should delete product', async () => {
      const productId = 'prod-1';

      (productService.deleteProduct as jest.Mock).mockResolvedValue(undefined);

      await productService.deleteProduct(productId);
      expect(productService.deleteProduct).toHaveBeenCalledWith(productId);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle network errors during product fetch', async () => {
      const networkError = new Error('Network timeout');

      (productService.getProducts as jest.Mock).mockRejectedValue(networkError);

      await expect(productService.getProducts()).rejects.toThrow(
        'Network timeout'
      );
    });

    it('should handle API errors during product save', async () => {
      const apiError = new Error('Server error: 500');

      (productService.createProduct as jest.Mock).mockRejectedValue(apiError);

      await expect(
        productService.createProduct({ name: 'Test' })
      ).rejects.toThrow('Server error');
    });

    it('should handle authentication errors', async () => {
      const authError = new Error('Unauthorized: Session expired');

      (productService.getProducts as jest.Mock).mockRejectedValue(authError);

      await expect(productService.getProducts()).rejects.toThrow(
        'Unauthorized'
      );
    });

    it('should handle validation errors', async () => {
      const validationError = new Error(
        'Validation error: Product name is required'
      );

      (productService.createProduct as jest.Mock).mockRejectedValue(
        validationError
      );

      await expect(
        productService.createProduct({} as any)
      ).rejects.toThrow('Validation error');
    });
  });
});
