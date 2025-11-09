import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../constants/theme';

interface FAQItem {
  question: string;
  answer: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const faqData: FAQItem[] = [
  {
    question: 'How do I add a product?',
    answer: 'You can add products by tapping the Scan button in the navigation bar. Use your camera to capture the serial number, warranty card, or receipt. Our AI will automatically extract product information.',
    icon: 'cube-outline',
  },
  {
    question: 'How are warranty expiration dates calculated?',
    answer: 'Warranty expiration dates are calculated based on the purchase date and warranty period extracted from your documents. You can also manually set or adjust these dates in the product details.',
    icon: 'calendar-outline',
  },
  {
    question: 'Can I backup my data?',
    answer: 'Yes! Your data is automatically backed up to your account when you\'re connected to the internet. You can also enable auto-backup in Settings for real-time synchronization.',
    icon: 'cloud-upload-outline',
  },
  {
    question: 'How do I edit product information?',
    answer: 'Navigate to Products, select the product you want to edit, and tap the edit icon in the top right corner. You can update all product details including warranty information.',
    icon: 'create-outline',
  },
  {
    question: 'What happens when a warranty expires?',
    answer: 'You\'ll receive notifications before your warranty expires (based on your reminder settings). The product will be marked as expired in your products list, but all information remains accessible.',
    icon: 'time-outline',
  },
  {
    question: 'How accurate is the AI scanning?',
    answer: 'Our AI achieves high accuracy in extracting product information, but we recommend reviewing and verifying the extracted data. You can always manually edit any information.',
    icon: 'eye-outline',
  },
];

const HelpSupportScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'How would you like to contact us?',
      [
        {
          text: 'Email',
          onPress: () => {
            Linking.openURL('mailto:support@snapregister.com?subject=Support Request');
          },
        },
        {
          text: 'Call',
          onPress: () => {
            Linking.openURL('tel:+1-800-SNAPREG');
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleLiveChat = () => {
    Alert.alert(
      'Live Chat',
      'Live chat support is coming soon! For now, please email us at support@snapregister.com',
      [{ text: 'OK' }]
    );
  };

  const handleKnowledgeBase = () => {
    Linking.openURL('https://snapregister.com/help');
  };

  const handleReportBug = () => {
    Linking.openURL('mailto:bugs@snapregister.com?subject=Bug Report');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.heroSection}>
          <Ionicons name="help-circle" size={64} color={colors.primary} />
          <Text style={styles.heroTitle}>How can we help you?</Text>
          <Text style={styles.heroSubtitle}>
            Find answers to common questions or get in touch with our support team
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

          {faqData.map((item, index) => (
            <View key={index} style={styles.faqItem}>
              <TouchableOpacity
                style={styles.faqHeader}
                onPress={() => toggleAccordion(index)}
                activeOpacity={0.7}
              >
                <View style={styles.faqHeaderLeft}>
                  <View style={styles.iconContainer}>
                    <Ionicons name={item.icon} size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.faqQuestion}>{item.question}</Text>
                </View>
                <Ionicons
                  name={expandedIndex === index ? 'chevron-up' : 'chevron-down'}
                  size={24}
                  color={colors.text.secondary}
                />
              </TouchableOpacity>

              {expandedIndex === index && (
                <View style={styles.faqAnswer}>
                  <Text style={styles.faqAnswerText}>{item.answer}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get in Touch</Text>

          <TouchableOpacity style={styles.contactCard} onPress={handleContactSupport}>
            <View style={styles.contactIconContainer}>
              <Ionicons name="mail" size={32} color={colors.white} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Contact Support</Text>
              <Text style={styles.contactDescription}>
                Email or call our support team
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.border.dark} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={handleLiveChat}>
            <View style={[styles.contactIconContainer, { backgroundColor: colors.secondary }]}>
              <Ionicons name="chatbubbles" size={32} color={colors.white} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Live Chat</Text>
              <Text style={styles.contactDescription}>
                Chat with us in real-time
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.border.dark} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={handleKnowledgeBase}>
            <View style={[styles.contactIconContainer, { backgroundColor: colors.warning }]}>
              <Ionicons name="book" size={32} color={colors.white} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Knowledge Base</Text>
              <Text style={styles.contactDescription}>
                Browse our help articles
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.border.dark} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={handleReportBug}>
            <View style={[styles.contactIconContainer, { backgroundColor: colors.error }]}>
              <Ionicons name="bug" size={32} color={colors.white} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Report a Bug</Text>
              <Text style={styles.contactDescription}>
                Help us improve the app
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.border.dark} />
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="time" size={20} color={colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Support Hours</Text>
            <Text style={styles.infoText}>
              Monday - Friday: 9:00 AM - 6:00 PM EST{'\n'}
              Weekend: Limited support via email
            </Text>
          </View>
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
  heroSection: {
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.medium,
  },
  heroTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  faqItem: {
    backgroundColor: colors.background.secondary,
    marginBottom: 1,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  faqHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  faqQuestion: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  faqAnswer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    paddingLeft: spacing.xl + 32 + spacing.md,
  },
  faqAnswerText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    marginBottom: 1,
  },
  contactIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  contactDescription: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    marginBottom: spacing.xxxl,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  infoTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 18,
  },
});

export default HelpSupportScreen;
