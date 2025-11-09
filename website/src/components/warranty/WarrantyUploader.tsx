'use client';

import React, { useState, useCallback } from 'react';
import { Upload, FileText, Image, AlertCircle, Loader2 } from 'lucide-react';
import { WarrantyAnalysis, WarrantyAnalysisStatus } from '@/types/warrantyAnalysis';

interface WarrantyUploaderProps {
  userId: string;
  productId?: string;
  onAnalysisComplete: (analysis: WarrantyAnalysis) => void;
  onError?: (error: string) => void;
}

export default function WarrantyUploader({
  userId,
  productId,
  onAnalysisComplete,
  onError,
}: WarrantyUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const validateFile = (file: File): string | null => {
    const allowedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
    ];

    if (!allowedTypes.includes(file.type)) {
      return 'Invalid file type. Please upload a PDF or image file (PNG, JPEG).';
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return 'File is too large. Maximum size is 10MB.';
    }

    return null;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const error = validateFile(file);

      if (error) {
        onError?.(error);
        return;
      }

      setSelectedFile(file);
    }
  }, [onError]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const error = validateFile(file);

      if (error) {
        onError?.(error);
        return;
      }

      setSelectedFile(file);
    }
  };

  const uploadAndAnalyze = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('user_id', userId);
      if (productId) {
        formData.append('product_id', productId);
      }

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/warranty/analyze', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze warranty');
      }

      const analysis: WarrantyAnalysis = await response.json();
      onAnalysisComplete(analysis);
      setSelectedFile(null);
    } catch (error) {
      console.error('Upload error:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to analyze warranty');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') {
      return <FileText className="w-12 h-12 text-red-500" />;
    }
    return <Image className="w-12 h-12 text-blue-500" />;
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!selectedFile ? (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-8
            transition-all duration-200 ease-in-out
            ${dragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
            }
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="warranty-upload"
            className="hidden"
            accept=".pdf,image/png,image/jpeg,image/jpg"
            onChange={handleFileChange}
            disabled={uploading}
          />

          <label
            htmlFor="warranty-upload"
            className="flex flex-col items-center justify-center cursor-pointer"
          >
            <Upload className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Upload Warranty Document
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
              Drag and drop your warranty document here, or click to browse
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
              <FileText className="w-4 h-4" />
              <span>PDF, PNG, JPEG up to 10MB</span>
            </div>
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center gap-4 mb-4">
              {getFileIcon(selectedFile)}
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  {selectedFile.name}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              {!uploading && (
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  Remove
                </button>
              )}
            </div>

            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Analyzing warranty...
                  </span>
                  <span className="text-gray-900 dark:text-gray-100 font-medium">
                    {progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Our AI is reading your warranty document and extracting key information...
                </p>
              </div>
            )}
          </div>

          {!uploading && (
            <button
              onClick={uploadAndAnalyze}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5" />
              Analyze Warranty Document
            </button>
          )}
        </div>
      )}

      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-semibold mb-1">AI-Powered Analysis</p>
            <p className="text-blue-700 dark:text-blue-300">
              Our AI will extract warranty duration, coverage details, exclusions, claim procedures,
              and important deadlines from your document.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
