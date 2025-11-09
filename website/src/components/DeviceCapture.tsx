'use client';

import React, { useEffect, useState } from 'react';
import { collectDeviceInfo } from '@/lib/device-detector';
import { DeviceInfo } from '@/types/device';

interface DeviceCaptureProps {
  onCapture: (deviceInfo: Partial<DeviceInfo>) => void;
  onContinue: () => void;
  onBack?: () => void;
  isLoading?: boolean;
}

export default function DeviceCapture({ onCapture, onContinue, onBack, isLoading }: DeviceCaptureProps) {
  const [deviceInfo, setDeviceInfo] = useState<Partial<DeviceInfo> | null>(null);
  const [capturing, setCapturing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const captureDevice = async () => {
      try {
        setCapturing(true);
        setError(null);

        // Collect device information
        const info = collectDeviceInfo();
        setDeviceInfo(info);

        // Send to API to store
        const response = await fetch('/api/device-info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(info)
        });

        if (!response.ok) {
          throw new Error('Failed to store device information');
        }

        const result = await response.json();

        // Call parent callback
        onCapture(info);

        setCapturing(false);
      } catch (err) {
        console.error('Error capturing device info:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setCapturing(false);
      }
    };

    captureDevice();
  }, [onCapture]);

  const getDeviceIcon = () => {
    if (!deviceInfo) return '📱';

    switch (deviceInfo.deviceType) {
      case 'MOBILE':
        return '📱';
      case 'TABLET':
        return '📱';
      case 'DESKTOP':
        return '💻';
      case 'SMARTTV':
        return '📺';
      default:
        return '🖥️';
    }
  };

  if (capturing) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Detecting Your Device...</h2>
            <p className="text-gray-600">Please wait while we capture device information</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Device Capture Failed</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={onContinue}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Continue Anyway
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{getDeviceIcon()}</div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">Device Detected!</h2>
          <p className="text-gray-600">We've automatically captured your device information</p>
        </div>

        {/* Device Information Display */}
        {deviceInfo && (
          <div className="space-y-4 mb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Device Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {/* Device Type */}
                {deviceInfo.deviceType && (
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {deviceInfo.deviceType.charAt(0) + deviceInfo.deviceType.slice(1).toLowerCase()}
                    </span>
                  </div>
                )}

                {/* Device Model */}
                {deviceInfo.deviceVendor && (
                  <div>
                    <span className="text-gray-600">Device:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {deviceInfo.deviceVendor} {deviceInfo.deviceModel || ''}
                    </span>
                  </div>
                )}

                {/* Operating System */}
                {deviceInfo.osName && (
                  <div>
                    <span className="text-gray-600">OS:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {deviceInfo.osName} {deviceInfo.osVersion || ''}
                    </span>
                  </div>
                )}

                {/* Browser */}
                {deviceInfo.browserName && (
                  <div>
                    <span className="text-gray-600">Browser:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {deviceInfo.browserName} {deviceInfo.browserVersion || ''}
                    </span>
                  </div>
                )}

                {/* Screen Resolution */}
                {deviceInfo.screenWidth && deviceInfo.screenHeight && (
                  <div>
                    <span className="text-gray-600">Screen:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {deviceInfo.screenWidth} × {deviceInfo.screenHeight}
                    </span>
                  </div>
                )}

                {/* Language */}
                {deviceInfo.language && (
                  <div>
                    <span className="text-gray-600">Language:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {deviceInfo.language}
                    </span>
                  </div>
                )}

                {/* Timezone */}
                {deviceInfo.timezone && (
                  <div className="col-span-2">
                    <span className="text-gray-600">Timezone:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {deviceInfo.timezone}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Capabilities */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Capabilities</h3>
              <div className="flex flex-wrap gap-2">
                {deviceInfo.touchSupport && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    Touch Support
                  </span>
                )}
                {deviceInfo.javaScriptEnabled && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    JavaScript
                  </span>
                )}
                {deviceInfo.cookiesEnabled && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    Cookies
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Privacy Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-900">
            <strong>Why we collect this:</strong> Device information helps manufacturers provide
            better warranty service and detect fraudulent registrations. This data is only shared
            with the manufacturer of your product.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between gap-4">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              disabled={isLoading}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Back
            </button>
          )}

          <button
            onClick={onContinue}
            disabled={isLoading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Continue to Submission'}
          </button>
        </div>
      </div>
    </div>
  );
}
