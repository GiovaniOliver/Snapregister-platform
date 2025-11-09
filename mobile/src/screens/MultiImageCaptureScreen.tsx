import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList, MultiImageCapture, ProductAnalysisResult } from '../types';
import { imageService } from '../services/imageService';
import { productService } from '../services/productService';
import { colors } from '../constants/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ImageSlot {
  key: keyof MultiImageCapture;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const imageSlots: ImageSlot[] = [
  {
    key: 'serialNumberImage',
    title: 'Serial Number',
    description: 'Photo of serial number label',
    icon: 'barcode-outline',
  },
  {
    key: 'warrantyCardImage',
    title: 'Warranty Card',
    description: 'Photo of warranty document',
    icon: 'shield-checkmark-outline',
  },
  {
    key: 'receiptImage',
    title: 'Receipt',
    description: 'Photo of purchase receipt',
    icon: 'receipt-outline',
  },
  {
    key: 'productImage',
    title: 'Product Photo',
    description: 'Photo of the product',
    icon: 'camera-outline',
  },
];

const MultiImageCaptureScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [images, setImages] = useState<MultiImageCapture>({});
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ProductAnalysisResult | null>(null);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera permission is required to capture images. Please grant permission in settings.'
      );
      return false;
    }
    return true;
  };

  const captureImage = async (slotKey: keyof MultiImageCapture) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImages((prev) => ({
          ...prev,
          [slotKey]: result.assets[0].uri,
        }));
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
    }
  };

  const pickImage = async (slotKey: keyof MultiImageCapture) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImages((prev) => ({
          ...prev,
          [slotKey]: result.assets[0].uri,
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const removeImage = (slotKey: keyof MultiImageCapture) => {
    setImages((prev) => {
      const newImages = { ...prev };
      delete newImages[slotKey];
      return newImages;
    });
  };

  const showImageOptions = (slotKey: keyof MultiImageCapture) => {
    const slot = imageSlots.find((s) => s.key === slotKey);
    if (!slot) return;

    Alert.alert(
      slot.title,
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: () => captureImage(slotKey),
        },
        {
          text: 'Choose from Gallery',
          onPress: () => pickImage(slotKey),
        },
        images[slotKey]
          ? {
              text: 'Remove',
              style: 'destructive',
              onPress: () => removeImage(slotKey),
            }
          : null,
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ].filter(Boolean) as any[]
    );
  };

  const handleAnalyze = async () => {
    const imageCount = Object.values(images).filter(Boolean).length;

    if (imageCount === 0) {
      Alert.alert('No Images', 'Please capture at least one image before analyzing.');
      return;
    }

    Alert.alert(
      'Analyze Images',
      `Upload and analyze ${imageCount} image${imageCount > 1 ? 's' : ''} to extract product information?\n\nThis may take a few moments.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Analyze',
          onPress: performAnalysis,
        },
      ]
    );
  };

  const performAnalysis = async () => {
    setProcessing(true);
    setShowProgressModal(true);
    setUploadProgress(0);
    setUploadStatus('Preparing images...');

    try {
      // Upload and analyze images with progress tracking
      const result = await imageService.uploadAndAnalyzeImages(images, (progress) => {
        setUploadProgress(progress);

        if (progress < 20) {
          setUploadStatus('Compressing images...');
        } else if (progress < 50) {
          setUploadStatus('Validating images...');
        } else if (progress < 90) {
          setUploadStatus('Analyzing with AI...');
        } else {
          setUploadStatus('Almost done...');
        }
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Analysis failed');
      }

      setAnalysisResult(result.data);
      setUploadStatus('Analysis complete!');
      setUploadProgress(100);

      // Wait a moment to show completion
      await new Promise(resolve => setTimeout(resolve, 500));
      setShowProgressModal(false);

      // Prepare product data from AI results
      const productData = {
        name: `${result.data.brand || 'Unknown'} ${result.data.model || 'Device'}`.trim(),
        brand: result.data.brand || 'Unknown',
        model: result.data.model || '',
        serialNumber: result.data.serialNumber || undefined,
        category: 'Electronics',
        purchaseDate: result.data.purchaseDate || new Date().toISOString(),
        retailer: result.data.retailer || undefined,
        purchasePrice: result.data.price || undefined,
        notes: [
          result.data.additionalInfo || '',
          result.data.warrantyPeriod ? `Warranty: ${result.data.warrantyPeriod} months` : '',
          result.data.warrantyEndDate ? `Warranty ends: ${new Date(result.data.warrantyEndDate).toLocaleDateString()}` : '',
          `Analyzed with ${result.data.confidence} confidence`,
          `Scanned on ${new Date().toLocaleDateString()}`,
        ].filter(Boolean).join('\n'),
      };

      // Save product to database
      const savedProduct = await productService.createProduct(productData);

      setProcessing(false);

      // Show success with extracted information
      Alert.alert(
        'Product Saved Successfully',
        `${savedProduct.brand} ${savedProduct.model}\n\n` +
        `Details:\n` +
        `Serial: ${savedProduct.serialNumber || 'N/A'}\n` +
        `Purchase Date: ${savedProduct.purchaseDate ? new Date(savedProduct.purchaseDate).toLocaleDateString() : 'N/A'}\n` +
        `Retailer: ${savedProduct.retailer || 'N/A'}\n` +
        `Price: ${savedProduct.purchasePrice ? `$${savedProduct.purchasePrice}` : 'N/A'}\n` +
        `Confidence: ${result.data.confidence}`,
        [
          {
            text: 'View Products',
            onPress: () => {
              navigation.navigate('Main');
            },
          },
          {
            text: 'Scan Another',
            onPress: () => {
              setImages({});
              setAnalysisResult(null);
            },
          },
        ]
      );
    } catch (error: any) {
      setProcessing(false);
      setShowProgressModal(false);
      console.error('Error analyzing and saving product:', error);

      // Show retry option
      Alert.alert(
        'Analysis Failed',
        error.message || 'Failed to analyze images. Please check your internet connection and try again.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Retry',
            onPress: performAnalysis,
          },
        ]
      );
    }
  };

  const imageCount = Object.values(images).filter(Boolean).length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={processing}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Scan Product</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.subtitle}>
            Capture up to 4 images for best results
          </Text>

          {/* Image Counter */}
          <View style={styles.counterContainer}>
            <View style={styles.counterBadge}>
              <Ionicons name="images" size={20} color={colors.primary} />
              <Text style={styles.counterText}>
                {imageCount} / 4 images
              </Text>
            </View>
          </View>

          {/* Image Slots */}
          <View style={styles.imageGrid}>
            {imageSlots.map((slot) => (
              <TouchableOpacity
                key={slot.key}
                style={styles.imageSlot}
                onPress={() => showImageOptions(slot.key)}
                disabled={processing}
              >
                {images[slot.key] ? (
                  <>
                    <Image source={{ uri: images[slot.key] }} style={styles.imagePreview} />
                    <View style={styles.imageOverlay}>
                      <Ionicons name="checkmark-circle" size={32} color={colors.status.success} />
                    </View>
                    {/* Retake button */}
                    <TouchableOpacity
                      style={styles.retakeButton}
                      onPress={() => showImageOptions(slot.key)}
                      disabled={processing}
                    >
                      <Ionicons name="camera-reverse" size={20} color={colors.white} />
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.emptySlot}>
                    <Ionicons name={slot.icon} size={40} color={colors.text.tertiary} />
                  </View>
                )}
                <View style={styles.slotInfo}>
                  <Text style={styles.slotTitle}>{slot.title}</Text>
                  <Text style={styles.slotDescription}>{slot.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            <Text style={styles.instructionsTitle}>Tips for Best Results</Text>
            <View style={styles.instructionItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.status.success} />
              <Text style={styles.instructionText}>Ensure good lighting</Text>
            </View>
            <View style={styles.instructionItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.status.success} />
              <Text style={styles.instructionText}>Keep text clearly visible</Text>
            </View>
            <View style={styles.instructionItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.status.success} />
              <Text style={styles.instructionText}>Avoid blurry images</Text>
            </View>
            <View style={styles.instructionItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.status.success} />
              <Text style={styles.instructionText}>More images = better accuracy</Text>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.analyzeButton,
              (imageCount === 0 || processing) && styles.analyzeButtonDisabled,
            ]}
            onPress={handleAnalyze}
            disabled={imageCount === 0 || processing}
          >
            {processing ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons name="sparkles" size={24} color={colors.white} />
                <Text style={styles.analyzeButtonText}>
                  Analyze {imageCount > 0 ? `${imageCount} Image${imageCount > 1 ? 's' : ''}` : 'Images'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Upload Progress Modal */}
        <Modal
          visible={showProgressModal}
          transparent
          animationType="fade"
          onRequestClose={() => {}}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.progressModal}>
              <Ionicons name="cloud-upload" size={48} color={colors.primary} />
              <Text style={styles.progressTitle}>Analyzing Images</Text>
              <Text style={styles.progressStatus}>{uploadStatus}</Text>

              {/* Progress Bar */}
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${uploadProgress}%` }]} />
              </View>

              <Text style={styles.progressPercentage}>{Math.round(uploadProgress)}%</Text>

              {/* Loading indicator */}
              <ActivityIndicator size="large" color={colors.primary} style={styles.progressSpinner} />
            </View>
          </View>
        </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.medium,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  counterContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  counterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  counterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  imageGrid: {
    gap: 16,
  },
  imageSlot: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.border.medium,
    borderStyle: 'dashed',
    position: 'relative',
  },
  emptySlot: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
  },
  imagePreview: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 4,
  },
  retakeButton: {
    position: 'absolute',
    bottom: 60,
    right: 12,
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  slotInfo: {
    padding: 12,
  },
  slotTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  slotDescription: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  instructions: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: 12,
  },
  footer: {
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: colors.border.medium,
  },
  analyzeButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzeButtonDisabled: {
    backgroundColor: colors.border.dark,
  },
  analyzeButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressModal: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 32,
    width: '80%',
    maxWidth: 340,
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  progressStatus: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: colors.border.light,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  progressSpinner: {
    marginTop: 8,
  },
});

export default MultiImageCaptureScreen;
