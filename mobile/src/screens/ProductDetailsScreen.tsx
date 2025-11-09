import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, Product, Warranty } from '../types';
import { productService } from '../services/productService';
import { warrantyService } from '../services/warrantyService';
import { colors } from '../constants/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetails'>;

const ProductDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { productId } = route.params;
  const [product, setProduct] = useState<Product | null>(null);
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProductDetails();
  }, [productId]);

  const loadProductDetails = async () => {
    try {
      setLoading(true);
      const [productData, warrantyData] = await Promise.all([
        productService.getProductById(productId),
        warrantyService.getProductWarranties(productId),
      ]);
      setProduct(productData);
      setWarranties(warrantyData);
    } catch (error) {
      console.error('Error loading product details:', error);
      Alert.alert('Error', 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await productService.deleteProduct(productId);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete product');
            }
          },
        },
      ]
    );
  };

  const handleWarrantyPress = (warrantyId: string) => {
    navigation.navigate('WarrantyDetails', { warrantyId });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Product not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        <Ionicons name="cube" size={100} color={colors.primary} />
      </View>

      <View style={styles.section}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productBrand}>
          {product.brand} - {product.model}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Product Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Category</Text>
          <Text style={styles.infoValue}>{product.category}</Text>
        </View>
        {product.serialNumber && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Serial Number</Text>
            <Text style={styles.infoValue}>{product.serialNumber}</Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Purchase Date</Text>
          <Text style={styles.infoValue}>
            {new Date(product.purchaseDate).toLocaleDateString()}
          </Text>
        </View>
        {product.purchasePrice && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Purchase Price</Text>
            <Text style={styles.infoValue}>
              ${product.purchasePrice.toFixed(2)}
            </Text>
          </View>
        )}
        {product.retailer && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Retailer</Text>
            <Text style={styles.infoValue}>{product.retailer}</Text>
          </View>
        )}
      </View>

      {product.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notesText}>{product.notes}</Text>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Warranties</Text>
          <TouchableOpacity>
            <Ionicons name="add-circle" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
        {warranties.length === 0 ? (
          <Text style={styles.emptyText}>No warranties registered</Text>
        ) : (
          warranties.map((warranty) => (
            <TouchableOpacity
              key={warranty.id}
              style={styles.warrantyCard}
              onPress={() => handleWarrantyPress(warranty.id)}
            >
              <View style={styles.warrantyIcon}>
                <Ionicons
                  name="shield-checkmark"
                  size={24}
                  color={warranty.isActive ? colors.status.success : colors.text.tertiary}
                />
              </View>
              <View style={styles.warrantyInfo}>
                <Text style={styles.warrantyProvider}>{warranty.provider}</Text>
                <Text style={styles.warrantyType}>{warranty.type}</Text>
                <Text style={styles.warrantyDate}>
                  Expires: {new Date(warranty.endDate).toLocaleDateString()}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.border.dark} />
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.editButton}>
          <Ionicons name="create-outline" size={20} color={colors.white} />
          <Text style={styles.editButtonText}>Edit Product</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={20} color={colors.error} />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    paddingVertical: 40,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.medium,
  },
  section: {
    backgroundColor: colors.background.secondary,
    marginTop: 10,
    padding: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border.medium,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 15,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 5,
  },
  productBrand: {
    fontSize: 18,
    color: colors.text.secondary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  infoLabel: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  infoValue: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '500',
  },
  notesText: {
    fontSize: 16,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  warrantyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  warrantyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  warrantyInfo: {
    flex: 1,
  },
  warrantyProvider: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 3,
  },
  warrantyType: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 3,
    textTransform: 'capitalize',
  },
  warrantyDate: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  actions: {
    padding: 20,
  },
  editButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  editButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  deleteButton: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.error,
  },
  deleteButtonText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  errorText: {
    fontSize: 16,
    color: colors.text.tertiary,
  },
});

export default ProductDetailsScreen;
