'use client';

import React, { useState } from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import WarrantyUploader from './WarrantyUploader';
import WarrantyAnalysisDisplay from './WarrantyAnalysisDisplay';
import { WarrantyAnalysis } from '@/types/warrantyAnalysis';

interface WarrantyAnalyzerPageProps {
  userId: string;
  productId?: string;
  onBack?: () => void;
}

export default function WarrantyAnalyzerPage({
  userId,
  productId,
  onBack,
}: WarrantyAnalyzerPageProps) {
  const [analysis, setAnalysis] = useState<WarrantyAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalysisComplete = (result: WarrantyAnalysis) => {
    setAnalysis(result);
    setError(null);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleReset = () => {
    setAnalysis(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
          )}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            AI Warranty Analyzer
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Upload your warranty document and let our AI extract all the important information
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-red-600 dark:text-red-400"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="flex-shrink-0 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        {!analysis ? (
          <WarrantyUploader
            userId={userId}
            productId={productId}
            onAnalysisComplete={handleAnalysisComplete}
            onError={handleError}
          />
        ) : (
          <div>
            {/* Success Banner */}
            <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 dark:text-green-100">
                    Analysis Complete!
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    We've extracted all the key information from your warranty document.
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Analyze Another
                </button>
              </div>
            </div>

            {/* Analysis Display */}
            <WarrantyAnalysisDisplay analysis={analysis} />
          </div>
        )}

        {/* How It Works */}
        {!analysis && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📄</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                1. Upload Document
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Upload your warranty PDF or take a photo of your warranty card
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                2. AI Analysis
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Our AI reads and extracts all important warranty information automatically
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                3. Get Results
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View organized warranty details with highlighted critical information
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
