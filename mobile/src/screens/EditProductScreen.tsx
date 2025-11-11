import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, Product } from '../types';
import { productService } from '../services/productService';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../constants/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProduct'>;

const EditProductScreen: React.FC<Props> = ({ route, navigation }) => {
  const { productId } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    model: '',
    serialNumber: '',
    category: 'Electronics',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchasePrice: '',
    retailer: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const productData = await productService.getProductById(productId!);
      setProduct(productData);
      setFormData({
        name: productData.name || '',
        brand: productData.brand || '',
        model: productData.model || '',
        serialNumber: productData.serialNumber || '',
        category: productData.category || 'Electronics',
        purchaseDate: productData.purchaseDate
          ? new Date(productData.purchaseDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        purchasePrice: productData.purchasePrice?.toString() || '',
        retailer: productData.retailer || '',
        notes: productData.notes || '',
      });
    } catch (error: any) {
      console.error('Error loading product:', error);
      Alert.alert('Error', 'Failed to load product details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.brand.trim()) {
      newErrors.brand = 'Brand is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    if (formData.purchasePrice && isNaN(parseFloat(formData.purchasePrice))) {
      newErrors.purchasePrice = 'Purchase price must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const productData: Partial<Product> = {
        name: formData.name.trim(),
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        serialNumber: formData.serialNumber.trim() || undefined,
        category: formData.category.trim(),
        purchaseDate: new Date(formData.purchaseDate).toISOString(),
        purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
        retailer: formData.retailer.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      };

      if (productId) {
        await productService.updateProduct(productId, productData);
        Alert.alert('Success', 'Product updated successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        const newProduct = await productService.createProduct(productData);
        Alert.alert('Success', 'Product created successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('ProductDetails' as any, { productId: newProduct.id }),
          },
        ]);
      }
    } catch (error: any) {
      console.error('Error saving product:', error);
      Alert.alert('Error', error.message || 'Failed to save product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {productId ? 'Edit Product' : 'Add Product'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Product Name *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={formData.name}
              onChangeText={(text) => {
                setFormData({ ...formData, name: text });
                if (errors.name) {
                  setErrors({ ...errors, name: '' });
                }
              }}
              placeholder="Enter product name"
              placeholderTextColor={colors.text.placeholder}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Brand *</Text>
            <TextInput
              style={[styles.input, errors.brand && styles.inputError]}
              value={formData.brand}
              onChangeText={(text) => {
                setFormData({ ...formData, brand: text });
                if (errors.brand) {
                  setErrors({ ...errors, brand: '' });
                }
              }}
              placeholder="Enter brand"
              placeholderTextColor={colors.text.placeholder}
              autoCapitalize="words"
            />
            {errors.brand && <Text style={styles.errorText}>{errors.brand}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Model</Text>
            <TextInput
              style={styles.input}
              value={formData.model}
              onChangeText={(text) => setFormData({ ...formData, model: text })}
              placeholder="Enter model"
              placeholderTextColor={colors.text.placeholder}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Serial Number</Text>
            <TextInput
              style={styles.input}
              value={formData.serialNumber}
              onChangeText={(text) => setFormData({ ...formData, serialNumber: text })}
              placeholder="Enter serial number"
              placeholderTextColor={colors.text.placeholder}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Category *</Text>
            <TextInput
              style={[styles.input, errors.category && styles.inputError]}
              value={formData.category}
              onChangeText={(text) => {
                setFormData({ ...formData, category: text });
                if (errors.category) {
                  setErrors({ ...errors, category: '' });
                }
              }}
              placeholder="Enter category"
              placeholderTextColor={colors.text.placeholder}
            />
            {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Purchase Date</Text>
            <TextInput
              style={styles.input}
              value={formData.purchaseDate}
              onChangeText={(text) => setFormData({ ...formData, purchaseDate: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.text.placeholder}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Purchase Price</Text>
            <TextInput
              style={[styles.input, errors.purchasePrice && styles.inputError]}
              value={formData.purchasePrice}
              onChangeText={(text) => {
                setFormData({ ...formData, purchasePrice: text });
                if (errors.purchasePrice) {
                  setErrors({ ...errors, purchasePrice: '' });
                }
              }}
              placeholder="0.00"
              placeholderTextColor={colors.text.placeholder}
              keyboardType="decimal-pad"
            />
            {errors.purchasePrice && <Text style={styles.errorText}>{errors.purchasePrice}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Retailer</Text>
            <TextInput
              style={styles.input}
              value={formData.retailer}
              onChangeText={(text) => setFormData({ ...formData, retailer: text })}
              placeholder="Enter retailer name"
              placeholderTextColor={colors.text.placeholder}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholder="Enter any additional notes"
              placeholderTextColor={colors.text.placeholder}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color={colors.white} />
                <Text style={styles.saveButtonText}>
                  {productId ? 'Update Product' : 'Create Product'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.medium,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
  form: {
    padding: spacing.xl,
  },
  formGroup: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: colors.text.primary,
  },
  inputError: {
    borderColor: colors.error,
  },
  textArea: {
    minHeight: 100,
    paddingTop: spacing.md,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.error,
    marginTop: spacing.xs,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    marginTop: spacing.xl,
  },
  saveButtonDisabled: {
    backgroundColor: colors.border.dark,
  },
  saveButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginLeft: spacing.sm,
  },
});

export default EditProductScreen;

