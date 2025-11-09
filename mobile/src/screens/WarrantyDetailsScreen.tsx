import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, Warranty } from '../types';
import { warrantyService } from '../services/warrantyService';
import { colors } from '../constants/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'WarrantyDetails'>;

const WarrantyDetailsScreen: React.FC<Props> = ({ route }) => {
  const { warrantyId } = route.params;
  const [warranty, setWarranty] = useState<Warranty | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWarrantyDetails();
  }, [warrantyId]);

  const loadWarrantyDetails = async () => {
    try {
      setLoading(true);
      const data = await warrantyService.getWarrantyById(warrantyId);
      setWarranty(data);
    } catch (error) {
      console.error('Error loading warranty details:', error);
      Alert.alert('Error', 'Failed to load warranty details');
    } finally {
      setLoading(false);
    }
  };

  const handleContact = (type: 'phone' | 'email' | 'website') => {
    if (!warranty?.contactInfo) return;

    switch (type) {
      case 'phone':
        if (warranty.contactInfo.phone) {
          Linking.openURL(`tel:${warranty.contactInfo.phone}`);
        }
        break;
      case 'email':
        if (warranty.contactInfo.email) {
          Linking.openURL(`mailto:${warranty.contactInfo.email}`);
        }
        break;
      case 'website':
        if (warranty.contactInfo.website) {
          Linking.openURL(warranty.contactInfo.website);
        }
        break;
    }
  };

  const calculateDaysRemaining = () => {
    if (!warranty) return 0;
    const endDate = new Date(warranty.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!warranty) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Warranty not found</Text>
      </View>
    );
  }

  const daysRemaining = calculateDaysRemaining();
  const isExpired = daysRemaining < 0;
  const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 30;

  return (
    <ScrollView style={styles.container}>
      <View
        style={[
          styles.statusCard,
          isExpired
            ? styles.expiredCard
            : isExpiringSoon
            ? styles.warningCard
            : styles.activeCard,
        ]}
      >
        <Ionicons
          name={
            isExpired
              ? 'close-circle'
              : isExpiringSoon
              ? 'warning'
              : 'shield-checkmark'
          }
          size={50}
          color={isExpired ? colors.error : isExpiringSoon ? colors.warning : colors.status.success}
        />
        <Text style={styles.statusTitle}>
          {isExpired
            ? 'Expired'
            : isExpiringSoon
            ? 'Expiring Soon'
            : 'Active'}
        </Text>
        <Text style={styles.statusSubtitle}>
          {isExpired
            ? `Expired ${Math.abs(daysRemaining)} days ago`
            : `${daysRemaining} days remaining`}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Warranty Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Provider</Text>
          <Text style={styles.infoValue}>{warranty.provider}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Type</Text>
          <Text style={[styles.infoValue, styles.capitalizeText]}>
            {warranty.type}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Start Date</Text>
          <Text style={styles.infoValue}>
            {new Date(warranty.startDate).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>End Date</Text>
          <Text style={styles.infoValue}>
            {new Date(warranty.endDate).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {warranty.coverageDetails && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coverage Details</Text>
          <Text style={styles.detailText}>{warranty.coverageDetails}</Text>
        </View>
      )}

      {warranty.claimInstructions && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Claim Instructions</Text>
          <Text style={styles.detailText}>{warranty.claimInstructions}</Text>
        </View>
      )}

      {warranty.contactInfo && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          {warranty.contactInfo.phone && (
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => handleContact('phone')}
            >
              <Ionicons name="call" size={24} color={colors.primary} />
              <Text style={styles.contactText}>{warranty.contactInfo.phone}</Text>
              <Ionicons name="chevron-forward" size={24} color={colors.border.dark} />
            </TouchableOpacity>
          )}
          {warranty.contactInfo.email && (
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => handleContact('email')}
            >
              <Ionicons name="mail" size={24} color={colors.primary} />
              <Text style={styles.contactText}>{warranty.contactInfo.email}</Text>
              <Ionicons name="chevron-forward" size={24} color={colors.border.dark} />
            </TouchableOpacity>
          )}
          {warranty.contactInfo.website && (
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => handleContact('website')}
            >
              <Ionicons name="globe" size={24} color={colors.primary} />
              <Text style={styles.contactText}>{warranty.contactInfo.website}</Text>
              <Ionicons name="chevron-forward" size={24} color={colors.border.dark} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {warranty.documentUrl && (
        <View style={styles.section}>
          <TouchableOpacity style={styles.documentButton}>
            <Ionicons name="document-text" size={24} color={colors.primary} />
            <Text style={styles.documentButtonText}>View Warranty Document</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.editButton}>
          <Ionicons name="create-outline" size={20} color={colors.white} />
          <Text style={styles.editButtonText}>Edit Warranty</Text>
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
  statusCard: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.medium,
  },
  activeCard: {
    backgroundColor: '#E8F5E9',
  },
  warningCard: {
    backgroundColor: '#FFF3CD',
  },
  expiredCard: {
    backgroundColor: '#FFEBEE',
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 15,
    marginBottom: 5,
  },
  statusSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  section: {
    backgroundColor: colors.background.secondary,
    marginTop: 10,
    padding: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border.medium,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 15,
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
  capitalizeText: {
    textTransform: 'capitalize',
  },
  detailText: {
    fontSize: 16,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  contactText: {
    flex: 1,
    fontSize: 16,
    color: colors.primary,
    marginLeft: 15,
  },
  documentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    backgroundColor: colors.border.light,
    borderRadius: 10,
  },
  documentButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 10,
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
  },
  editButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  errorText: {
    fontSize: 16,
    color: colors.text.tertiary,
  },
});

export default WarrantyDetailsScreen;
