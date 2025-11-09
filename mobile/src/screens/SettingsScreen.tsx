import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  language: 'en' | 'es' | 'fr';
  defaultReminderDays: number;
  autoBackup: boolean;
}

const SETTINGS_STORAGE_KEY = '@app_settings';

const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'light',
    language: 'en',
    defaultReminderDays: 30,
    autoBackup: true,
  });

  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        setSettings(parsedSettings);
        setIsDarkMode(parsedSettings.theme === 'dark');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (updatedSettings: AppSettings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updatedSettings));
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  };

  const handleThemeToggle = async (value: boolean) => {
    setIsDarkMode(value);
    const updatedSettings = {
      ...settings,
      theme: value ? 'dark' as const : 'light' as const,
    };
    await saveSettings(updatedSettings);
  };

  const handleLanguageChange = () => {
    Alert.alert(
      'Select Language',
      'Choose your preferred language',
      [
        {
          text: 'English',
          onPress: () => saveSettings({ ...settings, language: 'en' }),
        },
        {
          text: 'Spanish',
          onPress: () => saveSettings({ ...settings, language: 'es' }),
        },
        {
          text: 'French',
          onPress: () => saveSettings({ ...settings, language: 'fr' }),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleReminderDaysChange = () => {
    Alert.alert(
      'Warranty Reminder Days',
      'How many days before expiration should we remind you?',
      [
        {
          text: '7 days',
          onPress: () => saveSettings({ ...settings, defaultReminderDays: 7 }),
        },
        {
          text: '14 days',
          onPress: () => saveSettings({ ...settings, defaultReminderDays: 14 }),
        },
        {
          text: '30 days',
          onPress: () => saveSettings({ ...settings, defaultReminderDays: 30 }),
        },
        {
          text: '60 days',
          onPress: () => saveSettings({ ...settings, defaultReminderDays: 60 }),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleAutoBackupToggle = async (value: boolean) => {
    const updatedSettings = { ...settings, autoBackup: value };
    await saveSettings(updatedSettings);
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear temporary files and cached data. Your products and warranties will not be affected.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear image cache
              const cacheDir = FileSystem.cacheDirectory;
              if (cacheDir) {
                const files = await FileSystem.readDirectoryAsync(cacheDir);
                for (const file of files) {
                  await FileSystem.deleteAsync(`${cacheDir}${file}`, { idempotent: true });
                }
              }
              Alert.alert('Success', 'Cache cleared successfully!');
            } catch (error) {
              console.error('Error clearing cache:', error);
              Alert.alert('Error', 'Failed to clear cache. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Export all your products and warranties as a JSON file.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Export',
          onPress: () => {
            // TODO: Implement data export
            Alert.alert('Coming Soon', 'Data export feature will be available in the next update!');
          },
        },
      ]
    );
  };

  const getLanguageName = (code: string): string => {
    switch (code) {
      case 'en':
        return 'English';
      case 'es':
        return 'Spanish';
      case 'fr':
        return 'French';
      default:
        return 'English';
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
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="moon-outline" size={24} color={colors.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Dark Mode</Text>
                <Text style={styles.settingDescription}>
                  Use dark theme throughout the app
                </Text>
              </View>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={handleThemeToggle}
              trackColor={{ false: colors.border.dark, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>

          <TouchableOpacity style={styles.settingItem} onPress={handleLanguageChange}>
            <View style={styles.settingInfo}>
              <Ionicons name="language-outline" size={24} color={colors.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Language</Text>
                <Text style={styles.settingValue}>{getLanguageName(settings.language)}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.border.dark} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Warranty Management</Text>

          <TouchableOpacity style={styles.settingItem} onPress={handleReminderDaysChange}>
            <View style={styles.settingInfo}>
              <Ionicons name="alarm-outline" size={24} color={colors.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Default Reminder Days</Text>
                <Text style={styles.settingValue}>{settings.defaultReminderDays} days before expiration</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.border.dark} />
          </TouchableOpacity>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="cloud-upload-outline" size={24} color={colors.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Auto-Backup</Text>
                <Text style={styles.settingDescription}>
                  Automatically backup data to cloud
                </Text>
              </View>
            </View>
            <Switch
              value={settings.autoBackup}
              onValueChange={handleAutoBackupToggle}
              trackColor={{ false: colors.border.dark, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>

          <TouchableOpacity style={styles.settingItem} onPress={handleClearCache}>
            <View style={styles.settingInfo}>
              <Ionicons name="trash-outline" size={24} color={colors.warning} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.warning }]}>Clear Cache</Text>
                <Text style={styles.settingDescription}>
                  Free up storage space
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.border.dark} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleExportData}>
            <View style={styles.settingInfo}>
              <Ionicons name="download-outline" size={24} color={colors.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Export Data</Text>
                <Text style={styles.settingDescription}>
                  Download all your data
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.border.dark} />
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            Settings are saved locally on your device and synced to your account when connected.
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
  section: {
    backgroundColor: colors.background.secondary,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border.medium,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.lg,
  },
  settingText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  settingLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  settingValue: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.background.tertiary,
    padding: spacing.lg,
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    marginBottom: spacing.xxxl,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginLeft: spacing.md,
  },
});

export default SettingsScreen;
