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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, Warranty } from '../types';
import { warrantyService } from '../services/warrantyService';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../constants/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AddWarranty'>;

const AddWarrantyScreen: React.FC<Props> = ({ route, navigation }) => {
  const { productId, warrantyId } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [warranty, setWarranty] = useState<Warranty | null>(null);

  const [formData, setFormData] = useState({
    provider: '',
    type: 'manufacturer' as 'manufacturer' | 'extended' | 'retailer',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    coverageDetails: '',
    terms: '',
    claimInstructions: '',
    phone: '',
    email: '',
    website: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (warrantyId) {
      loadWarranty();
    } else if (productId) {
      // Set default end date to 1 year from start date
      const defaultEndDate = new Date();
      defaultEndDate.setFullYear(defaultEndDate.getFullYear() + 1);
      setFormData((prev) => ({
        ...prev,
        endDate: defaultEndDate.toISOString().split('T')[0],
      }));
    }
  }, [warrantyId, productId]);

  const loadWarranty = async () => {
    try {
      setLoading(true);
      const warrantyData = await warrantyService.getWarrantyById(warrantyId!);
      setWarranty(warrantyData);
      setFormData({
        provider: warrantyData.provider || '',
        type: warrantyData.type || 'manufacturer',
        startDate: warrantyData.startDate
          ? new Date(warrantyData.startDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        endDate: warrantyData.endDate
          ? new Date(warrantyData.endDate).toISOString().split('T')[0]
          : '',
        coverageDetails: warrantyData.coverageDetails || '',
        terms: warrantyData.terms || '',
        claimInstructions: warrantyData.claimInstructions || '',
        phone: warrantyData.contactInfo?.phone || '',
        email: warrantyData.contactInfo?.email || '',
        website: warrantyData.contactInfo?.website || '',
      });
    } catch (error: any) {
      console.error('Error loading warranty:', error);
      Alert.alert('Error', 'Failed to load warranty details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.provider.trim()) {
      newErrors.provider = 'Provider is required';
    }

    if (!formData.endDate.trim()) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end <= start) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    if (!productId && !warranty?.productId) {
      Alert.alert('Error', 'Product ID is required');
      return;
    }

    setSaving(true);
    try {
      const warrantyData: Partial<Warranty> = {
        productId: productId || warranty?.productId || '',
        provider: formData.provider.trim(),
        type: formData.type,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        coverageDetails: formData.coverageDetails.trim() || undefined,
        terms: formData.terms.trim() || undefined,
        claimInstructions: formData.claimInstructions.trim() || undefined,
        contactInfo: {
          phone: formData.phone.trim() || undefined,
          email: formData.email.trim() || undefined,
          website: formData.website.trim() || undefined,
        },
        isActive: new Date(formData.endDate) > new Date(),
      };

      if (warrantyId) {
        await warrantyService.updateWarranty(warrantyId, warrantyData);
        Alert.alert('Success', 'Warranty updated successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        const newWarranty = await warrantyService.createWarranty(warrantyData);
        Alert.alert('Success', 'Warranty created successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('WarrantyDetails' as any, { warrantyId: newWarranty.id }),
          },
        ]);
      }
    } catch (error: any) {
      console.error('Error saving warranty:', error);
      Alert.alert('Error', error.message || 'Failed to save warranty. Please try again.');
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
          {warrantyId ? 'Edit Warranty' : 'Add Warranty'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Provider *</Text>
            <TextInput
              style={[styles.input, errors.provider && styles.inputError]}
              value={formData.provider}
              onChangeText={(text) => {
                setFormData({ ...formData, provider: text });
                if (errors.provider) {
                  setErrors({ ...errors, provider: '' });
                }
              }}
              placeholder="Enter warranty provider"
              placeholderTextColor={colors.text.placeholder}
            />
            {errors.provider && <Text style={styles.errorText}>{errors.provider}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Type</Text>
            <View style={styles.typeContainer}>
              {(['manufacturer', 'extended', 'retailer'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    formData.type === type && styles.typeButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, type })}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      formData.type === type && styles.typeButtonTextActive,
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Start Date</Text>
            <TextInput
              style={styles.input}
              value={formData.startDate}
              onChangeText={(text) => setFormData({ ...formData, startDate: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.text.placeholder}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>End Date *</Text>
            <TextInput
              style={[styles.input, errors.endDate && styles.inputError]}
              value={formData.endDate}
              onChangeText={(text) => {
                setFormData({ ...formData, endDate: text });
                if (errors.endDate) {
                  setErrors({ ...errors, endDate: '' });
                }
              }}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.text.placeholder}
            />
            {errors.endDate && <Text style={styles.errorText}>{errors.endDate}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Coverage Details</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.coverageDetails}
              onChangeText={(text) => setFormData({ ...formData, coverageDetails: text })}
              placeholder="Enter coverage details"
              placeholderTextColor={colors.text.placeholder}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Terms</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.terms}
              onChangeText={(text) => setFormData({ ...formData, terms: text })}
              placeholder="Enter warranty terms"
              placeholderTextColor={colors.text.placeholder}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Claim Instructions</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.claimInstructions}
              onChangeText={(text) => setFormData({ ...formData, claimInstructions: text })}
              placeholder="Enter claim instructions"
              placeholderTextColor={colors.text.placeholder}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.sectionDivider}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="Enter phone number"
              placeholderTextColor={colors.text.placeholder}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={formData.email}
              onChangeText={(text) => {
                setFormData({ ...formData, email: text });
                if (errors.email) {
                  setErrors({ ...errors, email: '' });
                }
              }}
              placeholder="Enter email address"
              placeholderTextColor={colors.text.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Website</Text>
            <TextInput
              style={styles.input}
              value={formData.website}
              onChangeText={(text) => setFormData({ ...formData, website: text })}
              placeholder="Enter website URL"
              placeholderTextColor={colors.text.placeholder}
              keyboardType="url"
              autoCapitalize="none"
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
                  {warrantyId ? 'Update Warranty' : 'Create Warranty'}
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
    minHeight: 80,
    paddingTop: spacing.md,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.error,
    marginTop: spacing.xs,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  typeButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.medium,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  typeButtonTextActive: {
    color: colors.white,
  },
  sectionDivider: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.medium,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
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

export default AddWarrantyScreen;

