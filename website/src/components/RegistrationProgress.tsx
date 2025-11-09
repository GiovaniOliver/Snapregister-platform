'use client';

import React from 'react';
import { RegistrationStep } from '@/types/registration';

interface RegistrationProgressProps {
  currentStep: RegistrationStep;
  completedSteps: RegistrationStep[];
}

const steps = [
  { step: RegistrationStep.PHOTO_CAPTURE, label: 'Photos', icon: '📸' },
  { step: RegistrationStep.DATA_REVIEW, label: 'Review', icon: '🔍' },
  { step: RegistrationStep.USER_INFO, label: 'Your Info', icon: '👤' },
  { step: RegistrationStep.DEVICE_CAPTURE, label: 'Device', icon: '📱' },
  { step: RegistrationStep.SUBMISSION, label: 'Submit', icon: '✅' }
];

export default function RegistrationProgress({ currentStep, completedSteps }: RegistrationProgressProps) {
  const getStepStatus = (step: RegistrationStep) => {
    if (completedSteps.includes(step)) return 'completed';
    if (step === currentStep) return 'current';
    return 'pending';
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white border-green-500';
      case 'current':
        return 'bg-blue-500 text-white border-blue-500';
      default:
        return 'bg-gray-200 text-gray-500 border-gray-300';
    }
  };

  const getConnectorColor = (index: number) => {
    const prevStep = steps[index - 1];
    if (prevStep && completedSteps.includes(prevStep.step)) {
      return 'bg-green-500';
    }
    return 'bg-gray-300';
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        {steps.map((stepInfo, index) => {
          const status = getStepStatus(stepInfo.step);
          const stepColor = getStepColor(status);

          return (
            <React.Fragment key={stepInfo.step}>
              {/* Step Circle */}
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`
                    w-12 h-12 rounded-full border-2 flex items-center justify-center
                    text-xl font-bold transition-all duration-300
                    ${stepColor}
                    ${status === 'current' ? 'scale-110 shadow-lg' : ''}
                  `}
                >
                  {status === 'completed' ? '✓' : stepInfo.icon}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={`
                      text-sm font-medium
                      ${status === 'current' ? 'text-blue-600' : ''}
                      ${status === 'completed' ? 'text-green-600' : ''}
                      ${status === 'pending' ? 'text-gray-500' : ''}
                    `}
                  >
                    {stepInfo.label}
                  </p>
                  <p className="text-xs text-gray-400">Step {stepInfo.step}</p>
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-2">
                  <div
                    className={`
                      h-1 rounded-full transition-all duration-300
                      ${getConnectorColor(index + 1)}
                    `}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="mt-8 w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
          style={{
            width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`
          }}
        />
      </div>

      {/* Step Counter */}
      <div className="mt-4 text-center text-sm text-gray-600">
        Step {currentStep} of {steps.length}
      </div>
    </div>
  );
}
