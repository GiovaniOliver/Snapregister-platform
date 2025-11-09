'use client';

/**
 * Demo Page for Warranty Auto-Fill Feature
 * This demonstrates all the components in action
 */

import { useState } from 'react';
import {
  ManualSubmissionWizard,
  CopyDataPanel,
  FloatingQuickFillWidget,
  QuickFillButton,
  SubmissionHistory,
} from '@/components/warranty-autofill';
import type { UserData, ProductData, FormSubmission } from '@/lib/types/warranty-autofill';

export default function WarrantyRegistrationDemo() {
  const [showWizard, setShowWizard] = useState(false);
  const [showWidget, setShowWidget] = useState(false);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);

  // Mock user data
  const userData: UserData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '5551234567',
    address: '123 Main Street',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'US',
  };

  // Mock product data
  const productData: ProductData = {
    productName: 'French Door Refrigerator',
    manufacturer: 'Samsung',
    modelNumber: 'RF28R7351SR',
    serialNumber: 'ABC123XYZ456',
    purchaseDate: new Date('2024-01-15'),
    purchasePrice: 2499.99,
    retailer: 'Best Buy',
  };

  // Mock manufacturers
  const manufacturers = [
    { id: 'samsung', name: 'Samsung', logo: '/logos/samsung.png' },
    { id: 'lg', name: 'LG', logo: '/logos/lg.png' },
    { id: 'whirlpool', name: 'Whirlpool', logo: '/logos/whirlpool.png' },
    { id: 'ge', name: 'GE Appliances', logo: '/logos/ge.png' },
  ];

  // Mock templates (in production, fetch from API)
  const templates = [
    {
      id: 'template_samsung_1',
      manufacturerId: 'samsung',
      manufacturerName: 'Samsung',
      formName: 'Standard Warranty Registration',
      formUrl: 'https://www.samsung.com/us/support/warranty/',
      formType: 'WEB_FORM' as const,
      difficulty: 'EASY' as const,
      estimatedTime: 3,
      requiresCaptcha: false,
      requiresAccount: false,
      instructions: [
        {
          step: 1,
          title: 'Open Registration Form',
          description: 'Click the "Open Form" button above to navigate to Samsung\'s warranty registration page in a new tab.',
          estimatedTimeSeconds: 30,
        },
        {
          step: 2,
          title: 'Enter Personal Information',
          description: 'Copy and paste your name, email, and phone number into the corresponding fields on the Samsung form.',
          fieldsToCopy: ['firstName', 'lastName', 'email', 'phone'],
          estimatedTimeSeconds: 60,
        },
        {
          step: 3,
          title: 'Enter Product Information',
          description: 'Copy the serial number and model number. Samsung requires serial numbers without spaces or dashes.',
          fieldsToCopy: ['serialNumber', 'modelNumber', 'purchaseDate'],
          estimatedTimeSeconds: 60,
          notes: 'Important: Remove any spaces or dashes from the serial number. Use the formatted version provided.',
        },
        {
          step: 4,
          title: 'Review and Submit',
          description: 'Double-check all information for accuracy, agree to the terms, and click Submit. You should receive a confirmation email within a few minutes.',
          estimatedTimeSeconds: 30,
        },
      ],
      fieldMappings: [
        {
          ourField: 'firstName' as const,
          theirFieldName: 'first_name',
          theirFieldId: 'firstName',
          theirFieldType: 'text' as const,
          required: true,
        },
        {
          ourField: 'lastName' as const,
          theirFieldName: 'last_name',
          theirFieldId: 'lastName',
          theirFieldType: 'text' as const,
          required: true,
        },
        {
          ourField: 'email' as const,
          theirFieldName: 'email',
          theirFieldId: 'email',
          theirFieldType: 'email' as const,
          required: true,
        },
        {
          ourField: 'serialNumber' as const,
          theirFieldName: 'serial_number',
          theirFieldId: 'serialNumber',
          theirFieldType: 'text' as const,
          required: true,
          helpText: 'Enter without spaces or dashes',
        },
      ],
      timesUsed: 150,
      successCount: 145,
      failureCount: 5,
      verifiedWorking: true,
    },
  ];

  const handleComplete = (submissionId: string) => {
    console.log('Registration completed:', submissionId);
    setShowWizard(false);
    // In production, save to database and show success message
  };

  const handleCancel = () => {
    setShowWizard(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Warranty Registration Assistant
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Easily copy your product and personal information to manufacturer warranty forms.
            Choose from different tools based on your needs.
          </p>
        </div>

        {!showWizard ? (
          <>
            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {/* Guided Wizard */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Guided Wizard</h3>
                </div>
                <p className="text-gray-600 mb-4 text-sm">
                  Step-by-step instructions with screenshots showing exactly where to paste each field.
                </p>
                <button
                  onClick={() => setShowWizard(true)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
                >
                  Start Wizard
                </button>
              </div>

              {/* Quick Copy Panel */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Quick Copy</h3>
                </div>
                <p className="text-gray-600 mb-4 text-sm">
                  View all your information with individual copy buttons for each field.
                </p>
                <a
                  href="#copy-panel"
                  className="w-full inline-block text-center px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors"
                >
                  View Panel
                </a>
              </div>

              {/* Floating Widget */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Floating Widget</h3>
                </div>
                <p className="text-gray-600 mb-4 text-sm">
                  Keep a floating panel open while you fill out the manufacturer's form.
                </p>
                <QuickFillButton
                  onClick={() => setShowWidget(!showWidget)}
                  label={showWidget ? 'Close Widget' : 'Open Widget'}
                  showKeyboardHint={true}
                  className="w-full justify-center"
                />
              </div>
            </div>

            {/* Copy Data Panel Section */}
            <div id="copy-panel" className="mb-12">
              <CopyDataPanel
                userData={userData}
                productData={productData}
                onCopy={(fieldKey, value, format) => {
                  console.log(`Copied ${fieldKey}:`, value, 'in format:', format);
                }}
              />
            </div>

            {/* Submission History */}
            {submissions.length > 0 && (
              <div className="mb-12">
                <SubmissionHistory
                  submissions={submissions}
                  onViewSubmission={(id) => console.log('View submission:', id)}
                />
              </div>
            )}

            {/* Features Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <svg className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Smart Formatting</h3>
                    <p className="text-sm text-gray-600">
                      Automatically formats dates, phone numbers, and serial numbers to match manufacturer requirements.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <svg className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Multiple Formats</h3>
                    <p className="text-sm text-gray-600">
                      Copy data as form fields, plain text, or JSON for different use cases.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <svg className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Step-by-Step Guidance</h3>
                    <p className="text-sm text-gray-600">
                      Visual guides with screenshots show exactly where to paste each field.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <svg className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Progress Tracking</h3>
                    <p className="text-sm text-gray-600">
                      Track which fields you've copied and monitor your completion progress.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <svg className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Keyboard Shortcuts</h3>
                    <p className="text-sm text-gray-600">
                      Press Ctrl+Shift+C to toggle the quick fill widget from anywhere.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <svg className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Manufacturer Templates</h3>
                    <p className="text-sm text-gray-600">
                      Pre-configured templates for top 20 manufacturers with verified instructions.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Demo Mode</h3>
                  <p className="text-sm text-blue-800">
                    This is a demonstration of the warranty auto-fill feature. In production, data will be loaded from your account and saved to the database.
                    The actual manufacturer forms will open in a new tab for you to fill out while using these tools.
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <ManualSubmissionWizard
            manufacturers={manufacturers}
            templates={templates}
            userData={userData}
            productData={productData}
            registrationId="demo_registration_123"
            onComplete={handleComplete}
            onCancel={handleCancel}
          />
        )}

        {/* Floating Widget */}
        {showWidget && (
          <FloatingQuickFillWidget
            userData={userData}
            productData={productData}
            defaultOpen={true}
            position="bottom-right"
            onCopy={(fieldKey, value) => {
              console.log('Copied from widget:', fieldKey, value);
            }}
          />
        )}
      </div>
    </div>
  );
}
