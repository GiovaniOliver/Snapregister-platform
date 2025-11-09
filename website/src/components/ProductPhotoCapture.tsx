'use client';

import React, { useState, useRef } from 'react';
import { Camera, Upload, X, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ProductPhotoProps {
  onPhotoAnalyzed: (data: any) => void;
  onBack?: () => void;
}

export default function ProductPhotoCapture({ onPhotoAnalyzed, onBack }: ProductPhotoProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    // Convert to base64 for preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze-product-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: selectedImage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const result = await response.json();

      if (result.success) {
        setAnalysisResult(result.data);
        onPhotoAnalyzed(result.data);
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (err) {
      console.error('Error analyzing image:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze image');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRetake = () => {
    setSelectedImage(null);
    setAnalysisResult(null);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardContent className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Capture Product Information
            </h2>
            <p className="text-gray-600">
              Take a clear photo of your product's serial number, model number, or product label
            </p>
          </div>

          {/* Image Preview or Upload Area */}
          {!selectedImage ? (
            <div className="space-y-4">
              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors">
                <div className="space-y-4">
                  <div className="flex justify-center space-x-4">
                    <div className="text-gray-400">
                      <Camera className="h-16 w-16 mx-auto mb-4" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Upload or Take a Photo
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Make sure the text is clear and well-lit
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    {/* Camera Button (mobile) */}
                    <Button
                      type="button"
                      variant="default"
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      <Camera className="h-4 w-4" />
                      Take Photo
                    </Button>
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    {/* Upload Button */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Image
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Tips for Best Results:</h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Ensure good lighting - avoid shadows and glare</li>
                  <li>Keep the camera steady and focus on the text</li>
                  <li>Capture the entire label or serial number plate</li>
                  <li>Make sure text is readable in the preview</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Image Preview */}
              <div className="relative">
                <img
                  src={selectedImage}
                  alt="Product"
                  className="w-full h-auto rounded-lg border-2 border-gray-200"
                />
                {!analysisResult && (
                  <button
                    onClick={handleRetake}
                    className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-600" />
                  </button>
                )}
              </div>

              {/* Analysis Result */}
              {analysisResult && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-green-900 mb-2">
                        Information Extracted Successfully!
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {analysisResult.productName && (
                          <div>
                            <span className="text-green-700 font-medium">Product:</span>
                            <span className="ml-2 text-green-900">{analysisResult.productName}</span>
                          </div>
                        )}
                        {analysisResult.manufacturer && (
                          <div>
                            <span className="text-green-700 font-medium">Manufacturer:</span>
                            <span className="ml-2 text-green-900">{analysisResult.manufacturer}</span>
                          </div>
                        )}
                        {analysisResult.modelNumber && (
                          <div>
                            <span className="text-green-700 font-medium">Model #:</span>
                            <span className="ml-2 text-green-900 font-mono">{analysisResult.modelNumber}</span>
                          </div>
                        )}
                        {analysisResult.serialNumber && (
                          <div>
                            <span className="text-green-700 font-medium">Serial #:</span>
                            <span className="ml-2 text-green-900 font-mono">{analysisResult.serialNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                {!analysisResult ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleRetake}
                      disabled={isAnalyzing}
                      className="flex-1"
                    >
                      Retake Photo
                    </Button>
                    <Button
                      type="button"
                      onClick={analyzeImage}
                      disabled={isAnalyzing}
                      className="flex-1"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        'Analyze Photo'
                      )}
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRetake}
                    className="w-full"
                  >
                    Take Another Photo
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          {analysisResult && (
            <div className="mt-6 pt-6 border-t">
              <div className="flex gap-3">
                {onBack && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onBack}
                  >
                    Back
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={() => onPhotoAnalyzed(analysisResult)}
                  className="flex-1"
                >
                  Continue with Extracted Data
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
