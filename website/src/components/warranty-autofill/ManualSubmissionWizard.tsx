'use client';

import { useState, useCallback } from 'react';
import { FormGuide } from './FormGuide';
import { CopyDataPanel } from './CopyDataPanel';
import { SubmissionTracker } from './SubmissionTracker';
import type {
  ManufacturerFormTemplate,
  UserData,
  ProductData,
  FormSubmission,
  CopyFormat,
} from '@/lib/types/warranty-autofill';
import { DataFormatter } from '@/lib/services/data-formatter';

export interface ManualSubmissionWizardProps {
  manufacturers?: { id: string; name: string; logo?: string }[];
  templates?: ManufacturerFormTemplate[];
  userData: UserData;
  productData: ProductData;
  registrationId?: string;
  onComplete?: (submissionId: string) => void;
  onCancel?: () => void;
  className?: string;
}

type WizardStep = 'select-manufacturer' | 'select-template' | 'guided-copy' | 'complete';

export function ManualSubmissionWizard({
  manufacturers = [],
  templates = [],
  userData,
  productData,
  registrationId,
  onComplete,
  onCancel,
  className = '',
}: ManualSubmissionWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('select-manufacturer');
  const [selectedManufacturer, setSelectedManufacturer] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ManufacturerFormTemplate | null>(null);
  const [submission, setSubmission] = useState<FormSubmission | null>(null);
  const [copiedFields, setCopiedFields] = useState<string[]>([]);

  const formattedData = DataFormatter.formatRegistrationData(userData, productData);

  const handleManufacturerSelect = useCallback((manufacturerId: string) => {
    setSelectedManufacturer(manufacturerId);
    setCurrentStep('select-template');
  }, []);

  const handleTemplateSelect = useCallback((template: ManufacturerFormTemplate) => {
    setSelectedTemplate(template);

    // Create initial submission
    const newSubmission: FormSubmission = {
      id: `submission_${Date.now()}`,
      registrationId: registrationId || `reg_${Date.now()}`,
      templateId: template.id,
      userId: 'current_user', // This should come from auth
      status: 'IN_PROGRESS',
      currentStep: 1,
      totalSteps: template.instructions.length,
      copiedFields: [],
      startedAt: new Date().toISOString(),
    };

    setSubmission(newSubmission);
    setCurrentStep('guided-copy');
  }, [registrationId]);

  const handleFieldCopy = useCallback((fieldKey: string, value: string) => {
    setCopiedFields((prev) => {
      if (!prev.includes(fieldKey)) {
        return [...prev, fieldKey];
      }
      return prev;
    });

    if (submission) {
      setSubmission({
        ...submission,
        copiedFields: [...copiedFields, fieldKey],
      });
    }
  }, [submission, copiedFields]);

  const handleStepComplete = useCallback((stepNumber: number) => {
    if (submission) {
      setSubmission({
        ...submission,
        currentStep: stepNumber + 1,
      });
    }
  }, [submission]);

  const handleMarkComplete = useCallback(() => {
    if (submission) {
      const completedSubmission = {
        ...submission,
        status: 'COMPLETED' as const,
        completedAt: new Date().toISOString(),
      };
      setSubmission(completedSubmission);
      setCurrentStep('complete');
      onComplete?.(completedSubmission.id);
    }
  }, [submission, onComplete]);

  const handleAbandon = useCallback(() => {
    if (submission) {
      setSubmission({
        ...submission,
        status: 'ABANDONED' as const,
      });
    }
    onCancel?.();
  }, [submission, onCancel]);

  const handleRateExperience = useCallback(
    (rating: number, feedback: string) => {
      if (submission) {
        setSubmission({
          ...submission,
          difficultyRating: rating,
          feedback,
          wasHelpful: rating <= 3,
        });
      }
    },
    [submission]
  );

  const availableTemplates = selectedManufacturer
    ? templates.filter((t) => t.manufacturerId === selectedManufacturer)
    : [];

  return (
    <div className={`max-w-7xl mx-auto ${className}`}>
      {/* Progress Breadcrumb */}
      <nav className="mb-8" aria-label="Progress">
        <ol className="flex items-center">
          <li className="relative">
            <div
              className={`flex items-center ${
                currentStep === 'select-manufacturer'
                  ? 'text-blue-600'
                  : 'text-green-600'
              }`}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  currentStep === 'select-manufacturer'
                    ? 'bg-blue-100'
                    : 'bg-green-100'
                }`}
              >
                {currentStep === 'select-manufacturer' ? (
                  <span className="text-blue-600 font-semibold">1</span>
                ) : (
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </span>
              <span className="ml-3 text-sm font-medium">Select Manufacturer</span>
            </div>
          </li>

          <div className="mx-4 h-0.5 w-16 bg-gray-200">
            <div
              className={`h-full ${
                currentStep !== 'select-manufacturer' ? 'bg-green-600' : 'bg-gray-200'
              } transition-all duration-300`}
            />
          </div>

          <li className="relative">
            <div
              className={`flex items-center ${
                currentStep === 'select-template'
                  ? 'text-blue-600'
                  : currentStep === 'guided-copy' || currentStep === 'complete'
                  ? 'text-green-600'
                  : 'text-gray-500'
              }`}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  currentStep === 'select-template'
                    ? 'bg-blue-100'
                    : currentStep === 'guided-copy' || currentStep === 'complete'
                    ? 'bg-green-100'
                    : 'bg-gray-100'
                }`}
              >
                {currentStep === 'guided-copy' || currentStep === 'complete' ? (
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span className={`font-semibold ${currentStep === 'select-template' ? 'text-blue-600' : 'text-gray-500'}`}>
                    2
                  </span>
                )}
              </span>
              <span className="ml-3 text-sm font-medium">Choose Template</span>
            </div>
          </li>

          <div className="mx-4 h-0.5 w-16 bg-gray-200">
            <div
              className={`h-full ${
                currentStep === 'guided-copy' || currentStep === 'complete'
                  ? 'bg-green-600'
                  : 'bg-gray-200'
              } transition-all duration-300`}
            />
          </div>

          <li className="relative">
            <div
              className={`flex items-center ${
                currentStep === 'guided-copy'
                  ? 'text-blue-600'
                  : currentStep === 'complete'
                  ? 'text-green-600'
                  : 'text-gray-500'
              }`}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  currentStep === 'guided-copy'
                    ? 'bg-blue-100'
                    : currentStep === 'complete'
                    ? 'bg-green-100'
                    : 'bg-gray-100'
                }`}
              >
                {currentStep === 'complete' ? (
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span className={`font-semibold ${currentStep === 'guided-copy' ? 'text-blue-600' : 'text-gray-500'}`}>
                    3
                  </span>
                )}
              </span>
              <span className="ml-3 text-sm font-medium">Fill Form</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Step Content */}
      {currentStep === 'select-manufacturer' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Select Manufacturer
          </h2>
          <p className="text-gray-600 mb-6">
            Choose the manufacturer to view available registration forms
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {manufacturers.map((manufacturer) => (
              <button
                key={manufacturer.id}
                onClick={() => handleManufacturerSelect(manufacturer.id)}
                className="flex items-center gap-4 p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
              >
                {manufacturer.logo && (
                  <img
                    src={manufacturer.logo}
                    alt={manufacturer.name}
                    className="h-12 w-12 object-contain"
                  />
                )}
                <span className="text-lg font-medium text-gray-900">
                  {manufacturer.name}
                </span>
              </button>
            ))}
          </div>

          {manufacturers.length === 0 && (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No manufacturers found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Please add your product first to see available manufacturers
              </p>
            </div>
          )}
        </div>
      )}

      {currentStep === 'select-template' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Choose Registration Form
              </h2>
              <p className="text-gray-600 mt-1">
                Select the form template that matches the manufacturer's website
              </p>
            </div>
            <button
              onClick={() => setCurrentStep('select-manufacturer')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Change Manufacturer
            </button>
          </div>

          <div className="space-y-4">
            {availableTemplates.map((template) => (
              <div
                key={template.id}
                className="border border-gray-300 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer"
                onClick={() => handleTemplateSelect(template)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {template.formName}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {template.estimatedTime} min
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {template.instructions.length} steps
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          template.difficulty === 'EASY'
                            ? 'bg-green-100 text-green-800'
                            : template.difficulty === 'MEDIUM'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {template.difficulty}
                      </span>
                    </div>
                    {template.notes && (
                      <p className="text-sm text-gray-600 mt-2">{template.notes}</p>
                    )}
                  </div>
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>

          {availableTemplates.length === 0 && (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No form templates available
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                We're working on adding templates for this manufacturer
              </p>
            </div>
          )}
        </div>
      )}

      {currentStep === 'guided-copy' && selectedTemplate && submission && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <FormGuide
              template={selectedTemplate}
              registrationData={formattedData}
              onStepComplete={handleStepComplete}
              onFieldCopy={handleFieldCopy}
            />
          </div>
          <div className="space-y-6">
            <SubmissionTracker
              submission={submission}
              template={selectedTemplate}
              onMarkComplete={handleMarkComplete}
              onAbandon={handleAbandon}
              onRateExperience={handleRateExperience}
            />
            <CopyDataPanel
              userData={userData}
              productData={productData}
              onCopy={handleFieldCopy}
            />
          </div>
        </div>
      )}

      {currentStep === 'complete' && submission && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Registration Complete!
          </h2>
          <p className="text-gray-600 mb-6">
            Your warranty registration has been submitted successfully.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => {
                setCurrentStep('select-manufacturer');
                setSelectedManufacturer(null);
                setSelectedTemplate(null);
                setSubmission(null);
                setCopiedFields([]);
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Register Another Product
            </button>
            <button
              onClick={onCancel}
              className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-md font-medium hover:bg-gray-50 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
