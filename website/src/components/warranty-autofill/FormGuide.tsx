'use client';

import { useState } from 'react';
import Image from 'next/image';
import { CopyButton } from './CopyButton';
import type { ManufacturerFormTemplate, FormInstructionStep, FormattedRegistrationData } from '@/lib/types/warranty-autofill';

export interface FormGuideProps {
  template: ManufacturerFormTemplate;
  registrationData: FormattedRegistrationData;
  onStepComplete?: (stepNumber: number) => void;
  onFieldCopy?: (fieldKey: string, value: string) => void;
  className?: string;
}

export function FormGuide({
  template,
  registrationData,
  onStepComplete,
  onFieldCopy,
  className = '',
}: FormGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const handleStepComplete = (stepNumber: number) => {
    setCompletedSteps((prev) => new Set([...prev, stepNumber]));
    onStepComplete?.(stepNumber);

    // Auto-advance to next step
    if (currentStep < template.instructions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const currentInstruction = template.instructions[currentStep];
  const progress = ((completedSteps.size / template.instructions.length) * 100).toFixed(0);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return 'bg-green-100 text-green-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'HARD':
        return 'bg-orange-100 text-orange-800';
      case 'EXPERT':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFieldValue = (fieldKey: string): string => {
    return registrationData[fieldKey as keyof FormattedRegistrationData] || '';
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-lg font-semibold text-gray-900">
                {template.formName}
              </h2>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(template.difficulty)}`}>
                {template.difficulty}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {template.manufacturerName || 'Manufacturer'} Registration Form
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
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
              {template.requiresAccount && (
                <span className="flex items-center gap-1 text-orange-600">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Account required
                </span>
              )}
              {template.requiresCaptcha && (
                <span className="flex items-center gap-1 text-orange-600">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  CAPTCHA
                </span>
              )}
            </div>
          </div>
          <a
            href={template.formUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            Open Form
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium text-gray-900">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Form Screenshot/Video */}
      {(template.screenshotUrl || template.videoUrl) && (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          {template.videoUrl ? (
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
              <video
                src={template.videoUrl}
                controls
                className="w-full h-full"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          ) : template.screenshotUrl ? (
            <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden">
              <Image
                src={template.screenshotUrl}
                alt={`${template.formName} screenshot`}
                fill
                className="object-contain"
              />
            </div>
          ) : null}
        </div>
      )}

      {/* Step Navigation */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {template.instructions.map((step, index) => (
            <button
              key={step.step}
              onClick={() => setCurrentStep(index)}
              className={`
                flex-shrink-0 px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${currentStep === index
                  ? 'bg-blue-600 text-white'
                  : completedSteps.has(step.step)
                  ? 'bg-green-100 text-green-800'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <span className="flex items-center gap-2">
                {completedSteps.has(step.step) ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="h-4 w-4 flex items-center justify-center">
                    {step.step}
                  </span>
                )}
                <span className="hidden sm:inline">Step {step.step}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Current Step Content */}
      <div className="px-6 py-6">
        <div className="mb-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Step {currentInstruction.step}: {currentInstruction.title}
              </h3>
              {currentInstruction.estimatedTimeSeconds && (
                <p className="text-sm text-gray-500">
                  Estimated time: {Math.ceil(currentInstruction.estimatedTimeSeconds / 60)} minutes
                </p>
              )}
            </div>
            {!completedSteps.has(currentInstruction.step) && (
              <button
                onClick={() => handleStepComplete(currentInstruction.step)}
                className="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Mark Complete
              </button>
            )}
          </div>
          <p className="text-gray-700 leading-relaxed">
            {currentInstruction.description}
          </p>
          {currentInstruction.notes && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800 flex items-start gap-2">
                <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{currentInstruction.notes}</span>
              </p>
            </div>
          )}
        </div>

        {/* Step Image */}
        {currentInstruction.imageUrl && (
          <div className="mb-6 relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={currentInstruction.imageUrl}
              alt={`Step ${currentInstruction.step} illustration`}
              fill
              className="object-contain"
            />
          </div>
        )}

        {/* Fields to Copy for This Step */}
        {currentInstruction.fieldsToCopy && currentInstruction.fieldsToCopy.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Copy these fields:
            </h4>
            <div className="space-y-2">
              {currentInstruction.fieldsToCopy.map((fieldKey) => {
                const fieldValue = getFieldValue(fieldKey);
                const fieldMapping = template.fieldMappings.find(
                  (m) => m.ourField === fieldKey
                );

                return (
                  <div
                    key={fieldKey}
                    className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-md border border-gray-200"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">
                          {fieldKey}
                        </p>
                        {fieldMapping?.theirFieldName && (
                          <span className="text-xs text-gray-500">
                            → {fieldMapping.theirFieldName}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 truncate mt-0.5">
                        {fieldValue || 'N/A'}
                      </p>
                      {fieldMapping?.helpText && (
                        <p className="text-xs text-gray-500 mt-1">
                          {fieldMapping.helpText}
                        </p>
                      )}
                    </div>
                    <CopyButton
                      value={fieldValue}
                      label="Copy"
                      size="sm"
                      variant="secondary"
                      onCopy={() => onFieldCopy?.(fieldKey, fieldValue)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Step {currentStep + 1} of {template.instructions.length}
          </span>
          <button
            onClick={() => setCurrentStep(Math.min(template.instructions.length - 1, currentStep + 1))}
            disabled={currentStep === template.instructions.length - 1}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>

      {/* Notes Section */}
      {template.notes && (
        <div className="px-6 py-4 bg-blue-50 border-t border-blue-100">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Important Notes</h4>
          <p className="text-sm text-blue-800">{template.notes}</p>
        </div>
      )}
    </div>
  );
}
