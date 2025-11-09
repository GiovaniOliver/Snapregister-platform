'use client';

import React, { useState, useEffect } from 'react';
import { RegistrationStep, RegistrationState, RegistrationFormData, ProductInfo } from '@/types/registration';
import { UserContactInfoFormData, ProductInfoFormData } from '@/lib/validation';
import { DeviceInfo } from '@/types/device';
import RegistrationProgress from './RegistrationProgress';
import UserInfoForm from './UserInfoForm';
import DeviceCapture from './DeviceCapture';

interface RegistrationWizardProps {
  initialProductData?: Partial<ProductInfoFormData>;
}

export default function RegistrationWizard({ initialProductData }: RegistrationWizardProps) {
  const [state, setState] = useState<RegistrationState>({
    currentStep: RegistrationStep.USER_INFO, // Start at user info for demo
    completedSteps: [RegistrationStep.PHOTO_CAPTURE, RegistrationStep.DATA_REVIEW],
    formData: {
      extractedData: initialProductData as ProductInfo | undefined
    },
    isLoading: false
  });

  const [isComplete, setIsComplete] = useState(false);

  // Auto-save to localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('registrationState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setState(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Error loading saved state:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('registrationState', JSON.stringify(state));
  }, [state]);

  const handleUserInfoSubmit = (userInfo: UserContactInfoFormData) => {
    setState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        userInfo
      },
      currentStep: RegistrationStep.DEVICE_CAPTURE,
      completedSteps: [...prev.completedSteps, RegistrationStep.USER_INFO]
    }));
  };

  const handleDeviceCapture = (deviceInfo: Partial<DeviceInfo>) => {
    setState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        deviceInfo: deviceInfo.deviceFingerprint || ""
      },
      currentStep: RegistrationStep.SUBMISSION,
      completedSteps: [...prev.completedSteps, RegistrationStep.DEVICE_CAPTURE]
    }));
  };

  const handleSubmit = async (method: 'auto' | 'manual' | 'assisted') => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch('/api/registration/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productInfo: state.formData.extractedData,
          userInfo: state.formData.userInfo,
          submissionMethod: method
        })
      });

      const result = await response.json();

      if (result.success) {
        setState(prev => ({
          ...prev,
          completedSteps: [...prev.completedSteps, RegistrationStep.SUBMISSION],
          isLoading: false
        }));
        setIsComplete(true);
        localStorage.removeItem('registrationState');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Registration submission failed:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      }));
    }
  };

  const handleStepChange = (step: RegistrationStep) => {
    if (!isComplete) {
      setState(prev => ({ ...prev, currentStep: step }));
    }
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center max-w-md">
          <div className="mb-4">
            <svg className="w-16 h-16 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Registration Complete!</h2>
          <p className="text-gray-600 mb-6">
            Your product has been successfully registered.
          </p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <RegistrationProgress
          currentStep={state.currentStep}
          completedSteps={state.completedSteps}
        />

        {state.error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {state.error}
          </div>
        )}

        <div className="mt-8">
          {state.currentStep === RegistrationStep.USER_INFO && (
            <UserInfoForm
              initialData={state.formData.userInfo}
              onSubmit={handleUserInfoSubmit}
            />
          )}

          {state.currentStep === RegistrationStep.DEVICE_CAPTURE && (
            <DeviceCapture
              onCapture={handleDeviceCapture}
              onContinue={() => setState(prev => ({ ...prev, currentStep: RegistrationStep.SUBMISSION, completedSteps: [...prev.completedSteps, RegistrationStep.DEVICE_CAPTURE] }))}
            />
          )}

          {state.currentStep === RegistrationStep.SUBMISSION && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold mb-4">Choose Registration Method</h2>
              <p className="text-gray-600 mb-6">
                Select how you'd like to complete the product registration.
              </p>
              <div className="space-y-4">
                <button
                  onClick={() => handleSubmit('auto')}
                  className="w-full p-6 bg-blue-50 border-2 border-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={state.isLoading}
                >
                  <div className="font-semibold text-blue-900 mb-1">Automatic Registration</div>
                  <div className="text-sm text-blue-700">We'll register your product automatically</div>
                </button>
                <button
                  onClick={() => handleSubmit('assisted')}
                  className="w-full p-6 bg-gray-50 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={state.isLoading}
                >
                  <div className="font-semibold text-gray-900 mb-1">Assisted Registration</div>
                  <div className="text-sm text-gray-600">We'll guide you through the process</div>
                </button>
                <button
                  onClick={() => handleSubmit('manual')}
                  className="w-full p-6 bg-gray-50 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={state.isLoading}
                >
                  <div className="font-semibold text-gray-900 mb-1">Manual Registration</div>
                  <div className="text-sm text-gray-600">Download a pre-filled form</div>
                </button>
              </div>
              {state.isLoading && (
                <div className="mt-4 text-center text-gray-600">
                  Processing your registration...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}