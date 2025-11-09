import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { aiService } from '../services/aiService';
import { productService } from '../services/productService';
import { colors } from '../constants/theme';

const CameraCaptureScreen: React.FC = () => {
  const navigation = useNavigation();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [processing, setProcessing] = useState(false);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  const processAndSaveImage = async (imageUri: string) => {
    try {
      setProcessing(true);

      // Process image with AI
      const extractedData = await aiService.analyzeImage(imageUri);

      // Save product to database
      const productData = {
        name: extractedData.productName || `${extractedData.brand || 'Unknown'} ${extractedData.model || 'Device'}`.trim(),
        brand: extractedData.brand || 'Unknown',
        model: extractedData.model || '',
        serialNumber: extractedData.serialNumber,
        category: extractedData.category || 'Electronics',
        purchaseDate: new Date().toISOString(),
        notes: `Scanned on ${new Date().toLocaleDateString()}`,
      };

      const savedProduct = await productService.createProduct(productData);

      Alert.alert(
        'Product Saved',
        `${savedProduct.brand} ${savedProduct.model} has been added to your products.`,
        [
          {
            text: 'View Products',
            onPress: () => {
              navigation.navigate('Main');
            },
          },
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error processing image:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to process and save product. Please try again.'
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    try {
      setProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      await processAndSaveImage(photo.uri);
    } catch (error) {
      console.error('Error capturing image:', error);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
      setProcessing(false);
    }
  };

  const handleGalleryPick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await processAndSaveImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const handleClose = () => {
    navigation.goBack();
  };

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="camera-outline" size={80} color={colors.border.dark} />
        <Text style={styles.permissionText}>
          Camera permission is required to scan devices
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
      />
      <View style={styles.overlay}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={30} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Device</Text>
          <TouchableOpacity
            style={styles.flipButton}
            onPress={toggleCameraFacing}
          >
            <Ionicons name="camera-reverse" size={30} color={colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.scanArea}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            Position device label within frame
          </Text>
          <Text style={styles.instructionSubtext}>
            Ensure good lighting and focus
          </Text>
        </View>

        <View style={styles.controls}>
          {processing ? (
            <ActivityIndicator size="large" color={colors.white} />
          ) : (
            <View style={styles.controlsRow}>
              <TouchableOpacity
                style={styles.galleryButton}
                onPress={handleGalleryPick}
              >
                <Ionicons name="images" size={28} color={colors.white} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleCapture}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>

              <View style={styles.placeholder} />
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: 20,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
  flipButton: {
    padding: 10,
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: colors.white,
  },
  topLeft: {
    top: '20%',
    left: '10%',
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: '20%',
    right: '10%',
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: '30%',
    left: '10%',
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: '30%',
    right: '10%',
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  instructions: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 5,
  },
  instructionSubtext: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  controls: {
    paddingBottom: 50,
    alignItems: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 40,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.white,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.white,
  },
  placeholder: {
    width: 50,
  },
  permissionText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
    paddingHorizontal: 40,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  permissionButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CameraCaptureScreen;
