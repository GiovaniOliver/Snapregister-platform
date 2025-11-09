import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { colors } from '../constants/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ScanScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const handleCameraPress = () => {
    navigation.navigate('CameraCapture');
  };

  const handleMultiImagePress = () => {
    navigation.navigate('MultiImageCapture');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Scan Device</Text>
          <Text style={styles.subtitle}>
            Capture device information using your camera
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="camera" size={80} color={colors.primary} />
          </View>

          <Text style={styles.scanModeTitle}>Choose Scan Mode</Text>

          {/* Multi-Image Scan - Recommended */}
          <TouchableOpacity
            style={[styles.scanButton, styles.primaryButton]}
            onPress={handleMultiImagePress}
          >
            <View style={styles.buttonContent}>
              <View style={styles.buttonIcon}>
                <Ionicons name="images" size={28} color={colors.white} />
              </View>
              <View style={styles.buttonText}>
                <View style={styles.buttonTitleRow}>
                  <Text style={styles.buttonTitle}>Multi-Image Scan</Text>
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedText}>RECOMMENDED</Text>
                  </View>
                </View>
                <Text style={styles.buttonDescription}>
                  Capture serial number, warranty card, receipt, and product photo for best results
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Quick Single-Image Scan */}
          <TouchableOpacity
            style={[styles.scanButton, styles.secondaryButton]}
            onPress={handleCameraPress}
          >
            <View style={styles.buttonContent}>
              <View style={styles.buttonIconSecondary}>
                <Ionicons name="camera" size={28} color={colors.primary} />
              </View>
              <View style={styles.buttonText}>
                <Text style={styles.buttonTitleSecondary}>Quick Scan</Text>
                <Text style={styles.buttonDescriptionSecondary}>
                  Take a single photo for basic information
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Why Multi-Image Scan?</Text>
            <View style={styles.instructionList}>
              <View style={styles.instructionItem}>
                <Ionicons name="checkmark-circle" size={24} color={colors.status.success} />
                <Text style={styles.instructionText}>
                  More accurate product identification
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Ionicons name="checkmark-circle" size={24} color={colors.status.success} />
                <Text style={styles.instructionText}>
                  Automatic warranty period detection
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Ionicons name="checkmark-circle" size={24} color={colors.status.success} />
                <Text style={styles.instructionText}>
                  Extract purchase date and retailer from receipt
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Ionicons name="checkmark-circle" size={24} color={colors.status.success} />
                <Text style={styles.instructionText}>
                  Save time with AI-powered data extraction
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              AI-powered extraction will automatically identify device information
            </Text>
          </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.medium,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 20,
  },
  iconContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 20,
  },
  scanModeTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  scanButton: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    padding: 16,
  },
  secondaryButton: {
    backgroundColor: colors.background.secondary,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  buttonIconSecondary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  buttonText: {
    flex: 1,
  },
  buttonTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
    marginRight: 8,
  },
  buttonTitleSecondary: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  recommendedBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.5,
  },
  buttonDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
  },
  buttonDescriptionSecondary: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  infoSection: {
    marginTop: 24,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  instructionList: {
    gap: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: 12,
    flex: 1,
  },
  footer: {
    padding: 20,
    backgroundColor: colors.background.secondary,
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default ScanScreen;
