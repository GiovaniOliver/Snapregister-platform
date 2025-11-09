'use client';

// Warranty Settings Page

import WarrantyPreferencesForm from '@/components/warranty/WarrantyPreferencesForm';
import { ArrowLeft } from 'lucide-react';

export default function WarrantySettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <a
          href="/dashboard/warranties"
          className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Warranties
        </a>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Warranty Notification Settings
          </h1>
          <p className="text-gray-600 mt-2">
            Customize how and when you receive warranty expiration reminders
          </p>
        </div>

        {/* Preferences Form */}
        <WarrantyPreferencesForm />
      </div>
    </div>
  );
}
