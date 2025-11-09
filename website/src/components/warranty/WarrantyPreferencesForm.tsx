'use client';

// Warranty Notification Preferences Form

import { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, Smartphone, Clock, Save } from 'lucide-react';

interface Preferences {
  emailEnabled: boolean;
  inAppEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  reminder90Days: boolean;
  reminder30Days: boolean;
  reminder7Days: boolean;
  reminder1Day: boolean;
  customDays: number[];
  dailyDigest: boolean;
  weeklyDigest: boolean;
  monthlyDigest: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: number;
  quietHoursEnd: number;
  timezone: string;
  autoRenewReminder: boolean;
  lifetimeWarrantyReminder: boolean;
}

export default function WarrantyPreferencesForm() {
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [customDayInput, setCustomDayInput] = useState('');

  useEffect(() => {
    fetchPreferences();
  }, []);

  async function fetchPreferences() {
    try {
      setLoading(true);
      const response = await fetch('/api/warranties/preferences');

      if (!response.ok) {
        throw new Error('Failed to fetch preferences');
      }

      const data = await response.json();
      setPreferences(data.preferences);
    } catch (err) {
      console.error('Error fetching preferences:', err);
      setMessage({ type: 'error', text: 'Failed to load preferences' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!preferences) return;

    try {
      setSaving(true);
      const response = await fetch('/api/warranties/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      setMessage({ type: 'success', text: 'Preferences saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Error saving preferences:', err);
      setMessage({ type: 'error', text: 'Failed to save preferences' });
    } finally {
      setSaving(false);
    }
  }

  function updatePreference<K extends keyof Preferences>(
    key: K,
    value: Preferences[K]
  ) {
    if (!preferences) return;
    setPreferences({ ...preferences, [key]: value });
  }

  function addCustomDay() {
    if (!preferences) return;
    const days = parseInt(customDayInput, 10);
    if (isNaN(days) || days < 1 || days > 365) {
      setMessage({ type: 'error', text: 'Please enter a valid number between 1 and 365' });
      return;
    }
    if (preferences.customDays.includes(days)) {
      setMessage({ type: 'error', text: 'This reminder already exists' });
      return;
    }
    updatePreference('customDays', [...preferences.customDays, days].sort((a, b) => b - a));
    setCustomDayInput('');
  }

  function removeCustomDay(days: number) {
    if (!preferences) return;
    updatePreference(
      'customDays',
      preferences.customDays.filter((d) => d !== days)
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-100 rounded"></div>
          <div className="h-10 bg-gray-100 rounded"></div>
          <div className="h-10 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-red-600">Failed to load preferences</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Bell className="h-6 w-6 text-indigo-600" />
        Notification Preferences
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Notification Channels */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Notification Channels
          </h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.emailEnabled}
                onChange={(e) => updatePreference('emailEnabled', e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <Mail className="h-5 w-5 text-gray-600" />
              <span className="text-gray-700">Email notifications</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.inAppEnabled}
                onChange={(e) => updatePreference('inAppEnabled', e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="text-gray-700">In-app notifications</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.smsEnabled}
                onChange={(e) => updatePreference('smsEnabled', e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <MessageSquare className="h-5 w-5 text-gray-600" />
              <span className="text-gray-700">SMS notifications (coming soon)</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.pushEnabled}
                onChange={(e) => updatePreference('pushEnabled', e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <Smartphone className="h-5 w-5 text-gray-600" />
              <span className="text-gray-700">Push notifications (coming soon)</span>
            </label>
          </div>
        </div>

        {/* Reminder Schedule */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Reminder Schedule
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Select when you want to be notified before warranty expiration
          </p>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.reminder90Days}
                onChange={(e) => updatePreference('reminder90Days', e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <span className="text-gray-700">90 days before expiration</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.reminder30Days}
                onChange={(e) => updatePreference('reminder30Days', e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <span className="text-gray-700">30 days before expiration</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.reminder7Days}
                onChange={(e) => updatePreference('reminder7Days', e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <span className="text-gray-700">7 days before expiration</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.reminder1Day}
                onChange={(e) => updatePreference('reminder1Day', e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <span className="text-gray-700">1 day before expiration</span>
            </label>
          </div>

          {/* Custom Reminders */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Reminders
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max="365"
                placeholder="Days before"
                value={customDayInput}
                onChange={(e) => setCustomDayInput(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={addCustomDay}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Add
              </button>
            </div>
            {preferences.customDays.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {preferences.customDays.map((days) => (
                  <span
                    key={days}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                  >
                    {days} days
                    <button
                      type="button"
                      onClick={() => removeCustomDay(days)}
                      className="ml-1 text-indigo-600 hover:text-indigo-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Digest Settings */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Digest Settings
          </h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.dailyDigest}
                onChange={(e) => updatePreference('dailyDigest', e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <span className="text-gray-700">Daily digest</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.weeklyDigest}
                onChange={(e) => updatePreference('weeklyDigest', e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <span className="text-gray-700">Weekly digest</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.monthlyDigest}
                onChange={(e) => updatePreference('monthlyDigest', e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <span className="text-gray-700">Monthly digest</span>
            </label>
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-600" />
            Quiet Hours
          </h3>
          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={preferences.quietHoursEnabled}
              onChange={(e) =>
                updatePreference('quietHoursEnabled', e.target.checked)
              }
              className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <span className="text-gray-700">Enable quiet hours</span>
          </label>

          {preferences.quietHoursEnabled && (
            <div className="grid grid-cols-2 gap-4 ml-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <select
                  value={preferences.quietHoursStart || 22}
                  onChange={(e) =>
                    updatePreference('quietHoursStart', parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <select
                  value={preferences.quietHoursEnd || 8}
                  onChange={(e) =>
                    updatePreference('quietHoursEnd', parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Additional Settings */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Additional Settings
          </h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.autoRenewReminder}
                onChange={(e) =>
                  updatePreference('autoRenewReminder', e.target.checked)
                }
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <span className="text-gray-700">
                Remind me about auto-renewal options
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.lifetimeWarrantyReminder}
                onChange={(e) =>
                  updatePreference('lifetimeWarrantyReminder', e.target.checked)
                }
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <span className="text-gray-700">
                Send reminders for lifetime warranties
              </span>
            </label>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-5 w-5" />
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </form>
    </div>
  );
}
