'use client';

import { useState, useCallback } from 'react';
import { CopyButton, CopyFieldButton } from './CopyButton';
import { DataFormatter } from '@/lib/services/data-formatter';
import type { UserData, ProductData, CopyFormat, FormattedRegistrationData } from '@/lib/types/warranty-autofill';

export interface CopyDataPanelProps {
  userData: UserData;
  productData: ProductData;
  onCopy?: (fieldKey: string, value: string, format: CopyFormat) => void;
  className?: string;
}

export function CopyDataPanel({
  userData,
  productData,
  onCopy,
  className = '',
}: CopyDataPanelProps) {
  const [selectedFormat, setSelectedFormat] = useState<CopyFormat>('FORM_FIELDS');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Format the data
  const formattedData = DataFormatter.formatRegistrationData(userData, productData);

  const handleFieldCopy = useCallback((fieldLabel: string, value: string) => {
    setCopiedField(fieldLabel);
    onCopy?.(fieldLabel, value, 'FORM_FIELDS');

    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  }, [onCopy]);

  const handleCopyAll = useCallback(async () => {
    let content = '';

    switch (selectedFormat) {
      case 'PLAIN_TEXT':
        content = DataFormatter.toPlainText(formattedData);
        break;
      case 'JSON':
        content = DataFormatter.toJSON(formattedData);
        break;
      case 'FORM_FIELDS':
      default:
        // Format as tab-separated values for easy pasting
        content = [
          `${formattedData.firstName}\t${formattedData.lastName}`,
          formattedData.email,
          formattedData.phone,
          formattedData.address,
          formattedData.city,
          formattedData.state,
          formattedData.zipCode,
          formattedData.productName,
          formattedData.manufacturer,
          formattedData.modelNumber,
          formattedData.serialNumber,
          formattedData.purchaseDate,
          formattedData.purchasePrice,
          formattedData.retailer,
        ].filter(Boolean).join('\n');
        break;
    }

    try {
      await navigator.clipboard.writeText(content);
      onCopy?.('all', content, selectedFormat);
    } catch (error) {
      console.error('Failed to copy all data:', error);
    }
  }, [selectedFormat, formattedData, onCopy]);

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Copy Registration Data
          </h2>
          <div className="flex items-center gap-2">
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value as CopyFormat)}
              className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              aria-label="Select copy format"
            >
              <option value="FORM_FIELDS">Form Fields</option>
              <option value="PLAIN_TEXT">Plain Text</option>
              <option value="JSON">JSON</option>
            </select>
            <CopyButton
              value=""
              label="Copy All"
              size="md"
              variant="primary"
              onClick={handleCopyAll}
            />
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Click individual copy buttons or copy all data at once
        </p>
      </div>

      <div className="divide-y divide-gray-200">
        {/* Personal Information Section */}
        <div className="px-6 py-5">
          <div className="flex items-center gap-2 mb-4">
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h3 className="text-base font-semibold text-gray-900">Personal Information</h3>
          </div>
          <div className="space-y-3">
            <CopyFieldButton
              fieldLabel="First Name"
              value={formattedData.firstName}
              onCopy={handleFieldCopy}
            />
            <CopyFieldButton
              fieldLabel="Last Name"
              value={formattedData.lastName}
              onCopy={handleFieldCopy}
            />
            <CopyFieldButton
              fieldLabel="Full Name"
              value={formattedData.fullName}
              onCopy={handleFieldCopy}
            />
            <CopyFieldButton
              fieldLabel="Email"
              value={formattedData.email}
              onCopy={handleFieldCopy}
            />
            <CopyFieldButton
              fieldLabel="Phone"
              value={formattedData.phone}
              onCopy={handleFieldCopy}
              hint="formatted"
            />
            <CopyFieldButton
              fieldLabel="Phone (Raw)"
              value={formattedData.phoneRaw}
              onCopy={handleFieldCopy}
              hint="digits only"
            />
            <CopyFieldButton
              fieldLabel="Address"
              value={formattedData.address}
              onCopy={handleFieldCopy}
            />
            <CopyFieldButton
              fieldLabel="City"
              value={formattedData.city}
              onCopy={handleFieldCopy}
            />
            <CopyFieldButton
              fieldLabel="State"
              value={formattedData.state}
              onCopy={handleFieldCopy}
            />
            <CopyFieldButton
              fieldLabel="ZIP Code"
              value={formattedData.zipCode}
              onCopy={handleFieldCopy}
            />
            <CopyFieldButton
              fieldLabel="Country"
              value={formattedData.country}
              onCopy={handleFieldCopy}
            />
            <CopyFieldButton
              fieldLabel="Full Address"
              value={formattedData.addressFormatted}
              onCopy={handleFieldCopy}
              hint="single line"
            />
          </div>
        </div>

        {/* Product Information Section */}
        <div className="px-6 py-5">
          <div className="flex items-center gap-2 mb-4">
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="text-base font-semibold text-gray-900">Product Information</h3>
          </div>
          <div className="space-y-3">
            <CopyFieldButton
              fieldLabel="Product Name"
              value={formattedData.productName}
              onCopy={handleFieldCopy}
            />
            <CopyFieldButton
              fieldLabel="Manufacturer"
              value={formattedData.manufacturer}
              onCopy={handleFieldCopy}
            />
            <CopyFieldButton
              fieldLabel="Model Number"
              value={formattedData.modelNumber}
              onCopy={handleFieldCopy}
            />
            <CopyFieldButton
              fieldLabel="Serial Number"
              value={formattedData.serialNumber}
              onCopy={handleFieldCopy}
              hint="formatted"
            />
            <CopyFieldButton
              fieldLabel="Serial Number (Raw)"
              value={formattedData.serialNumberRaw}
              onCopy={handleFieldCopy}
              hint="as-is"
            />
            <CopyFieldButton
              fieldLabel="Purchase Date"
              value={formattedData.purchaseDate}
              onCopy={handleFieldCopy}
              hint="MM/DD/YYYY"
            />
            <CopyFieldButton
              fieldLabel="Purchase Date (ISO)"
              value={formattedData.purchaseDateISO}
              onCopy={handleFieldCopy}
              hint="YYYY-MM-DD"
            />
            <CopyFieldButton
              fieldLabel="Purchase Price"
              value={formattedData.purchasePrice}
              onCopy={handleFieldCopy}
              hint="with $"
            />
            <CopyFieldButton
              fieldLabel="Purchase Price (Raw)"
              value={formattedData.purchasePriceRaw}
              onCopy={handleFieldCopy}
              hint="numbers only"
            />
            <CopyFieldButton
              fieldLabel="Retailer"
              value={formattedData.retailer}
              onCopy={handleFieldCopy}
            />
          </div>
        </div>
      </div>

      {/* Copy Feedback Toast */}
      {copiedField && (
        <div className="fixed bottom-4 right-4 z-50 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <div>
            <p className="font-semibold">Copied!</p>
            <p className="text-sm text-green-100">{copiedField}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export interface CompactCopyDataPanelProps {
  userData: UserData;
  productData: ProductData;
  onCopy?: (fieldKey: string, value: string) => void;
  className?: string;
}

export function CompactCopyDataPanel({
  userData,
  productData,
  onCopy,
  className = '',
}: CompactCopyDataPanelProps) {
  const formattedData = DataFormatter.formatRegistrationData(userData, productData);

  const essentialFields = [
    { label: 'Full Name', value: formattedData.fullName },
    { label: 'Email', value: formattedData.email },
    { label: 'Phone', value: formattedData.phone },
    { label: 'Serial Number', value: formattedData.serialNumber },
    { label: 'Model Number', value: formattedData.modelNumber },
    { label: 'Purchase Date', value: formattedData.purchaseDate },
  ];

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Copy</h3>
      <div className="space-y-2">
        {essentialFields.map((field) => (
          <div key={field.label} className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600">{field.label}</p>
              <p className="text-sm text-gray-900 truncate">{field.value || '-'}</p>
            </div>
            <CopyButton
              value={field.value}
              label=""
              size="sm"
              variant="ghost"
              showLabel={false}
              onCopy={() => onCopy?.(field.label, field.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
