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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../constants/theme';
import { api } from '../services/api';

const EditProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    addressLine2: user?.addressLine2 || '',
    city: user?.city || '',
    state: user?.state || '',
    zipCode: user?.zipCode || '',
    country: user?.country || 'US',
    registrationEmail: user?.registrationEmail || '',
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
    companyName: user?.companyName || '',
    alternatePhone: user?.alternatePhone || '',
    preferredContact: user?.preferredContact || 'EMAIL',
  });

  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatar || null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (formData.registrationEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.registrationEmail)) {
      newErrors.registrationEmail = 'Invalid email format';
    }

    if (formData.phone && !/^[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    // Load profile data when component mounts
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.get('/profile');
      if (response.data && response.data.profile) {
        const profile = response.data.profile;
        setFormData({
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          email: user?.email || '', // Keep login email separate
          phone: profile.phone || '',
          address: profile.address || '',
          addressLine2: profile.addressLine2 || '',
          city: profile.city || '',
          state: profile.state || '',
          zipCode: profile.zipCode || '',
          country: profile.country || 'US',
          registrationEmail: profile.registrationEmail || '',
          dateOfBirth: profile.dateOfBirth 
            ? new Date(profile.dateOfBirth).toISOString().split('T')[0] 
            : '',
          companyName: profile.companyName || '',
          alternatePhone: profile.alternatePhone || '',
          preferredContact: profile.preferredContact || 'EMAIL',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // If profile endpoint fails, use basic user data
      if (user) {
        setFormData(prev => ({
          ...prev,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
        }));
      }
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to upload your avatar.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Prepare update data (exclude login email - that's managed separately)
      const updateData: any = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        addressLine2: formData.addressLine2.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        zipCode: formData.zipCode.trim() || null,
        country: formData.country.trim() || 'US',
        registrationEmail: formData.registrationEmail.trim() || null,
        dateOfBirth: formData.dateOfBirth || null,
        companyName: formData.companyName.trim() || null,
        alternatePhone: formData.alternatePhone.trim() || null,
        preferredContact: formData.preferredContact,
      };

      // If avatar changed, upload it first
      if (avatarUri && avatarUri !== user?.avatar && !avatarUri.startsWith('http')) {
        try {
          // Upload avatar to Bunny.net via backend
          const formData = new FormData();
          formData.append('file', {
            uri: avatarUri,
            name: `avatar_${Date.now()}.jpg`,
            type: 'image/jpeg',
          } as any);
          formData.append('folder', 'avatars');

          const uploadResponse = await api.post('/upload', formData);

          if (uploadResponse.data && uploadResponse.data.success && uploadResponse.data.url) {
            updateData.avatar = uploadResponse.data.url;
          } else {
            throw new Error('Avatar upload failed');
          }
        } catch (uploadError: any) {
          console.error('Error uploading avatar:', uploadError);
          Alert.alert('Warning', 'Failed to upload avatar. Profile will be updated without avatar.');
        }
      } else if (avatarUri && avatarUri.startsWith('http')) {
        // Already a URL, use it directly
        updateData.avatar = avatarUri;
      }

      // Call API to update profile
      await api.put('/profile', updateData);

      // Refresh user data
      await refreshUser();

      Alert.alert('Success', 'Profile updated successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickImage} style={styles.avatarContainer}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={50} color={colors.white} />
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              <Ionicons name="camera" size={16} color={colors.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Tap to change avatar</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={[styles.input, errors.firstName && styles.inputError]}
              value={formData.firstName}
              onChangeText={(text) => {
                setFormData({ ...formData, firstName: text });
                if (errors.firstName) {
                  setErrors({ ...errors, firstName: '' });
                }
              }}
              placeholder="Enter first name"
              placeholderTextColor={colors.text.placeholder}
              autoCapitalize="words"
            />
            {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={[styles.input, errors.lastName && styles.inputError]}
              value={formData.lastName}
              onChangeText={(text) => {
                setFormData({ ...formData, lastName: text });
                if (errors.lastName) {
                  setErrors({ ...errors, lastName: '' });
                }
              }}
              placeholder="Enter last name"
              placeholderTextColor={colors.text.placeholder}
              autoCapitalize="words"
            />
            {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Registration Email</Text>
            <TextInput
              style={[styles.input, errors.registrationEmail && styles.inputError]}
              value={formData.registrationEmail}
              onChangeText={(text) => {
                setFormData({ ...formData, registrationEmail: text });
                if (errors.registrationEmail) {
                  setErrors({ ...errors, registrationEmail: '' });
                }
              }}
              placeholder="Email for product registrations"
              placeholderTextColor={colors.text.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={styles.hintText}>
              This email will be used for product registrations. If not set, your login email will be used.
            </Text>
            {errors.registrationEmail && <Text style={styles.errorText}>{errors.registrationEmail}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={[styles.input, errors.phone && styles.inputError]}
              value={formData.phone}
              onChangeText={(text) => {
                setFormData({ ...formData, phone: text });
                if (errors.phone) {
                  setErrors({ ...errors, phone: '' });
                }
              }}
              placeholder="(555) 123-4567"
              placeholderTextColor={colors.text.placeholder}
              keyboardType="phone-pad"
            />
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Street Address</Text>
            <TextInput
              style={styles.input}
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              placeholder="123 Main St"
              placeholderTextColor={colors.text.placeholder}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Address Line 2 (Optional)</Text>
            <TextInput
              style={styles.input}
              value={formData.addressLine2}
              onChangeText={(text) => setFormData({ ...formData, addressLine2: text })}
              placeholder="Apartment, suite, unit, etc."
              placeholderTextColor={colors.text.placeholder}
            />
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 2 }]}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                value={formData.city}
                onChangeText={(text) => setFormData({ ...formData, city: text })}
                placeholder="City"
                placeholderTextColor={colors.text.placeholder}
              />
            </View>
            <View style={[styles.formGroup, { flex: 1, marginLeft: spacing.md }]}>
              <Text style={styles.label}>State</Text>
              <TextInput
                style={styles.input}
                value={formData.state}
                onChangeText={(text) => setFormData({ ...formData, state: text })}
                placeholder="CA"
                placeholderTextColor={colors.text.placeholder}
              />
            </View>
            <View style={[styles.formGroup, { flex: 1, marginLeft: spacing.md }]}>
              <Text style={styles.label}>ZIP</Text>
              <TextInput
                style={styles.input}
                value={formData.zipCode}
                onChangeText={(text) => setFormData({ ...formData, zipCode: text })}
                placeholder="90210"
                placeholderTextColor={colors.text.placeholder}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Date of Birth (Optional)</Text>
            <TextInput
              style={styles.input}
              value={formData.dateOfBirth}
              onChangeText={(text) => setFormData({ ...formData, dateOfBirth: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.text.placeholder}
            />
            <Text style={styles.hintText}>
              Some registration forms require date of birth
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Company Name (Optional)</Text>
            <TextInput
              style={styles.input}
              value={formData.companyName}
              onChangeText={(text) => setFormData({ ...formData, companyName: text })}
              placeholder="For business registrations"
              placeholderTextColor={colors.text.placeholder}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color={colors.white} />
                <Text style={styles.saveButtonText}>Save Changes</Text>
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
  container: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    backgroundColor: colors.background.secondary,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.background.secondary,
  },
  avatarHint: {
    marginTop: spacing.md,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
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
  formRow: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
  },
  hintText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
});

export default EditProfileScreen;
