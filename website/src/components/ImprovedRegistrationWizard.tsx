'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProductPhotoCapture from './ProductPhotoCapture';
import ManufacturerRegistrationHelper from './ManufacturerRegistrationHelper';
import { Card, CardContent } from './ui/card';
import { CheckCircle, Camera, FileText, ExternalLink, Bell } from 'lucide-react';

enum WizardStep {
  PHOTO_CAPTURE = 'PHOTO_CAPTURE',
  REVIEW_DATA = 'REVIEW_DATA',
  MANUFACTURER_REGISTRATION = 'MANUFACTURER_REGISTRATION',
  COMPLETE = 'COMPLETE',
}

const steps = [
  { id: WizardStep.PHOTO_CAPTURE, name: 'Capture Photo', icon: Camera },
  { id: WizardStep.REVIEW_DATA, name: 'Review Data', icon: FileText },
  { id: WizardStep.MANUFACTURER_REGISTRATION, name: 'Register with Manufacturer', icon: ExternalLink },
  { id: WizardStep.COMPLETE, name: 'Complete', icon: CheckCircle },
];

export default function ImprovedRegistrationWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>(WizardStep.PHOTO_CAPTURE);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [savedProductId, setSavedProductId] = useState<string | null>(null);

  const handlePhotoAnalyzed = async (data: any) => {
    setExtractedData(data);
    setCurrentStep(WizardStep.REVIEW_DATA);
  };

  const handleDataConfirmed = async () => {
    try {
      // Save the product to the database
      const response = await fetch('/api/registration/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productInfo: extractedData,
          submissionMethod: 'photo_capture',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save product');
      }

      const result = await response.json();
      setSavedProductId(result.productId);
      setCurrentStep(WizardStep.MANUFACTURER_REGISTRATION);
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product. Please try again.');
    }
  };

  const handleRegistrationComplete = () => {
    setCurrentStep(WizardStep.COMPLETE);
  };

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;

              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`
                        w-12 h-12 rounded-full flex items-center justify-center transition-all
                        ${isCompleted
                          ? 'bg-green-600 text-white'
                          : isActive
                          ? 'bg-blue-600 text-white ring-4 ring-blue-200'
                          : 'bg-gray-300 text-gray-600'
                        }
                      `}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <Icon className="h-6 w-6" />
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <div
                        className={`text-sm font-medium ${
                          isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                        }`}
                      >
                        {step.name}
                      </div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-4 transition-all ${
                        isCompleted ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                      style={{ maxWidth: '100px' }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="mt-8">
          {currentStep === WizardStep.PHOTO_CAPTURE && (
            <ProductPhotoCapture
              onPhotoAnalyzed={handlePhotoAnalyzed}
            />
          )}

          {currentStep === WizardStep.REVIEW_DATA && extractedData && (
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Review Extracted Information</h2>
                  <p className="text-gray-600 mb-6">
                    Please review the information we extracted from your photo. You can edit any fields if needed.
                  </p>

                  <div className="space-y-4 mb-6">
                    {Object.entries(extractedData).map(([key, value]) => {
                      if (!value || key === 'extractedAt' || key === 'warrantyStartDate') return null;

                      return (
                        <div key={key} className="flex flex-col">
                          <label className="text-sm font-medium text-gray-700 mb-1">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                          </label>
                          <input
                            type="text"
                            value={value as string}
                            onChange={(e) => {
                              setExtractedData({
                                ...extractedData,
                                [key]: e.target.value,
                              });
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setCurrentStep(WizardStep.PHOTO_CAPTURE)}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleDataConfirmed}
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Save & Continue
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentStep === WizardStep.MANUFACTURER_REGISTRATION && extractedData && (
            <ManufacturerRegistrationHelper
              productData={extractedData}
              onComplete={handleRegistrationComplete}
            />
          )}

          {currentStep === WizardStep.COMPLETE && (
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="mb-6">
                    <CheckCircle className="h-20 w-20 text-green-600 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                      Registration Complete!
                    </h2>
                    <p className="text-gray-600">
                      Your product has been successfully registered and saved to your account.
                    </p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-6 mb-6">
                    <div className="flex items-start gap-3">
                      <Bell className="h-6 w-6 text-blue-600 mt-0.5" />
                      <div className="text-left">
                        <h3 className="font-semibold text-blue-900 mb-2">
                          Warranty Reminders Enabled
                        </h3>
                        <p className="text-sm text-blue-800">
                          We'll send you notifications when your warranty is about to expire, so you never miss important coverage dates.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Go to Dashboard
                    </button>
                    <button
                      onClick={() => {
                        setCurrentStep(WizardStep.PHOTO_CAPTURE);
                        setExtractedData(null);
                        setSavedProductId(null);
                      }}
                      className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    >
                      Register Another Product
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
