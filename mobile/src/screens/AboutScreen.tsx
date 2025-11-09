import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../constants/theme';

const AboutScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const buildNumber = Constants.expoConfig?.extra?.buildNumber || '1';

  const handleLinkPress = (url: string, title: string) => {
    Linking.openURL(url).catch(() => {
      console.error(`Failed to open ${title}`);
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="shield-checkmark" size={80} color={colors.primary} />
          </View>
          <Text style={styles.appName}>SnapRegister</Text>
          <Text style={styles.tagline}>Warranty Management Made Easy</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>Version {appVersion}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About SnapRegister</Text>
          <Text style={styles.description}>
            SnapRegister is your personal warranty management assistant. Easily track warranties,
            store product information, and never miss an expiration date again. Our AI-powered
            scanning technology makes it simple to register products and keep all your important
            documents in one secure place.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Information</Text>

          <View style={styles.infoRow}>
            <Ionicons name="business-outline" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Company</Text>
              <Text style={styles.infoValue}>SnapRegister Inc.</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>San Francisco, CA</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Contact</Text>
              <TouchableOpacity onPress={() => Linking.openURL('mailto:info@snapregister.com')}>
                <Text style={styles.infoLink}>info@snapregister.com</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="globe-outline" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Website</Text>
              <TouchableOpacity onPress={() => Linking.openURL('https://snapregister.com')}>
                <Text style={styles.infoLink}>snapregister.com</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>

          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => handleLinkPress('https://snapregister.com/terms', 'Terms of Service')}
          >
            <View style={styles.linkLeft}>
              <Ionicons name="document-text-outline" size={24} color={colors.primary} />
              <Text style={styles.linkText}>Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.border.dark} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => handleLinkPress('https://snapregister.com/privacy', 'Privacy Policy')}
          >
            <View style={styles.linkLeft}>
              <Ionicons name="shield-outline" size={24} color={colors.primary} />
              <Text style={styles.linkText}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.border.dark} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => handleLinkPress('https://snapregister.com/licenses', 'Open Source Licenses')}
          >
            <View style={styles.linkLeft}>
              <Ionicons name="code-slash-outline" size={24} color={colors.primary} />
              <Text style={styles.linkText}>Open Source Licenses</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.border.dark} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connect With Us</Text>

          <View style={styles.socialLinks}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => Linking.openURL('https://twitter.com/snapregister')}
            >
              <Ionicons name="logo-twitter" size={28} color={colors.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => Linking.openURL('https://facebook.com/snapregister')}
            >
              <Ionicons name="logo-facebook" size={28} color={colors.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => Linking.openURL('https://instagram.com/snapregister')}
            >
              <Ionicons name="logo-instagram" size={28} color={colors.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => Linking.openURL('https://linkedin.com/company/snapregister')}
            >
              <Ionicons name="logo-linkedin" size={28} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.technicalSection}>
          <Text style={styles.technicalTitle}>Technical Information</Text>
          <View style={styles.technicalItem}>
            <Text style={styles.technicalLabel}>App Version:</Text>
            <Text style={styles.technicalValue}>{appVersion}</Text>
          </View>
          <View style={styles.technicalItem}>
            <Text style={styles.technicalLabel}>Build Number:</Text>
            <Text style={styles.technicalValue}>{buildNumber}</Text>
          </View>
          <View style={styles.technicalItem}>
            <Text style={styles.technicalLabel}>Platform:</Text>
            <Text style={styles.technicalValue}>{Constants.platform?.ios ? 'iOS' : 'Android'}</Text>
          </View>
          <View style={styles.technicalItem}>
            <Text style={styles.technicalLabel}>Expo SDK:</Text>
            <Text style={styles.technicalValue}>{Constants.expoConfig?.sdkVersion || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.copyrightText}>
            Copyright 2024 SnapRegister Inc.{'\n'}
            All rights reserved.
          </Text>
          <Text style={styles.madeWithText}>
            Made with <Ionicons name="heart" size={14} color={colors.error} /> in San Francisco
          </Text>
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
  logoSection: {
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.medium,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  appName: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  tagline: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  versionBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xxl,
  },
  versionText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  section: {
    backgroundColor: colors.background.secondary,
    marginTop: spacing.lg,
    padding: spacing.xl,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border.medium,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  description: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  infoContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  infoValue: {
    fontSize: fontSize.base,
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
  },
  infoLink: {
    fontSize: fontSize.base,
    color: colors.primary,
    fontWeight: fontWeight.medium,
    textDecorationLine: 'underline',
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  linkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  linkText: {
    fontSize: fontSize.base,
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
    marginLeft: spacing.md,
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  technicalSection: {
    backgroundColor: colors.background.tertiary,
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  technicalTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  technicalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  technicalLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  technicalValue: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  copyrightText: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  madeWithText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default AboutScreen;
