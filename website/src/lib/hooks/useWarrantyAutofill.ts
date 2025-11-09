'use client';

import { useState, useCallback, useEffect } from 'react';
import type {
  UserData,
  ProductData,
  ManufacturerFormTemplate,
  FormSubmission,
  CopyFormat,
  CopyEvent,
} from '../types/warranty-autofill';

interface UseWarrantyAutofillOptions {
  userData: UserData;
  productData: ProductData;
  registrationId?: string;
  onCopySuccess?: (event: CopyEvent) => void;
  onSubmissionComplete?: (submissionId: string) => void;
}

export function useWarrantyAutofill({
  userData,
  productData,
  registrationId,
  onCopySuccess,
  onSubmissionComplete,
}: UseWarrantyAutofillOptions) {
  const [templates, setTemplates] = useState<ManufacturerFormTemplate[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<ManufacturerFormTemplate | null>(null);
  const [submission, setSubmission] = useState<FormSubmission | null>(null);
  const [copiedFields, setCopiedFields] = useState<Set<string>>(new Set());
  const [copyHistory, setCopyHistory] = useState<CopyEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch form templates for a manufacturer
   */
  const fetchTemplates = useCallback(async (manufacturerId?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const url = manufacturerId
        ? `/api/warranty-autofill/templates?manufacturerId=${manufacturerId}`
        : '/api/warranty-autofill/templates';

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setTemplates(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch templates');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching templates:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Format data for copying
   */
  const formatData = useCallback(async (format: CopyFormat = 'FORM_FIELDS') => {
    try {
      const response = await fetch('/api/warranty-autofill/format-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userData,
          productData,
          options: {
            dateFormat: 'MM/DD/YYYY',
            phoneFormat: 'US',
            addressFormat: 'US_STANDARD',
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to format data');
      }
    } catch (err) {
      console.error('Error formatting data:', err);
      throw err;
    }
  }, [userData, productData]);

  /**
   * Handle field copy with tracking
   */
  const handleFieldCopy = useCallback(
    (fieldKey: string, value: string, format: CopyFormat = 'FORM_FIELDS') => {
      // Add to copied fields set
      setCopiedFields((prev) => new Set([...prev, fieldKey]));

      // Create copy event
      const copyEvent: CopyEvent = {
        fieldKey,
        fieldLabel: fieldKey,
        value,
        format,
        timestamp: new Date(),
      };

      // Add to history
      setCopyHistory((prev) => [...prev, copyEvent]);

      // Update submission if exists
      if (submission) {
        setSubmission({
          ...submission,
          copiedFields: [...copiedFields, fieldKey],
        });
      }

      // Call success callback
      onCopySuccess?.(copyEvent);
    },
    [copiedFields, submission, onCopySuccess]
  );

  /**
   * Start a new submission
   */
  const startSubmission = useCallback(
    async (template: ManufacturerFormTemplate) => {
      setCurrentTemplate(template);

      const newSubmission: FormSubmission = {
        id: `submission_${Date.now()}`,
        registrationId: registrationId || `reg_${Date.now()}`,
        templateId: template.id,
        userId: 'current_user', // Replace with actual user ID from auth
        status: 'IN_PROGRESS',
        currentStep: 1,
        totalSteps: template.instructions.length,
        copiedFields: [],
        startedAt: new Date().toISOString(),
      };

      setSubmission(newSubmission);
      setCopiedFields(new Set());
      setCopyHistory([]);

      // Save to database
      try {
        const response = await fetch('/api/warranty-autofill/submissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            registrationId: newSubmission.registrationId,
            templateId: template.id,
            userId: newSubmission.userId,
            totalSteps: template.instructions.length,
          }),
        });

        const data = await response.json();
        if (data.success) {
          setSubmission(data.data);
        }
      } catch (err) {
        console.error('Error creating submission:', err);
      }

      return newSubmission;
    },
    [registrationId]
  );

  /**
   * Update submission progress
   */
  const updateSubmission = useCallback(
    async (updates: Partial<FormSubmission>) => {
      if (!submission) return;

      const updatedSubmission = { ...submission, ...updates };
      setSubmission(updatedSubmission);

      // Save to database
      try {
        await fetch(`/api/warranty-autofill/submissions/${submission.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });
      } catch (err) {
        console.error('Error updating submission:', err);
      }
    },
    [submission]
  );

  /**
   * Complete submission
   */
  const completeSubmission = useCallback(
    async (rating?: number, feedback?: string) => {
      if (!submission) return;

      const updates: Partial<FormSubmission> = {
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
        difficultyRating: rating,
        feedback,
      };

      await updateSubmission(updates);
      onSubmissionComplete?.(submission.id);
    },
    [submission, updateSubmission, onSubmissionComplete]
  );

  /**
   * Abandon submission
   */
  const abandonSubmission = useCallback(async () => {
    if (!submission) return;

    await updateSubmission({
      status: 'ABANDONED',
    });

    setSubmission(null);
    setCurrentTemplate(null);
  }, [submission, updateSubmission]);

  /**
   * Get progress percentage
   */
  const getProgress = useCallback(() => {
    if (!submission) return 0;
    return (submission.currentStep / submission.totalSteps) * 100;
  }, [submission]);

  /**
   * Check if field has been copied
   */
  const isFieldCopied = useCallback(
    (fieldKey: string) => {
      return copiedFields.has(fieldKey);
    },
    [copiedFields]
  );

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setTemplates([]);
    setCurrentTemplate(null);
    setSubmission(null);
    setCopiedFields(new Set());
    setCopyHistory([]);
    setError(null);
  }, []);

  return {
    // State
    templates,
    currentTemplate,
    submission,
    copiedFields,
    copyHistory,
    isLoading,
    error,

    // Actions
    fetchTemplates,
    formatData,
    handleFieldCopy,
    startSubmission,
    updateSubmission,
    completeSubmission,
    abandonSubmission,

    // Utilities
    getProgress,
    isFieldCopied,
    reset,
  };
}

/**
 * Hook for clipboard operations with fallback
 */
export function useClipboard() {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string): Promise<boolean> => {
    try {
      // Try modern Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return true;
      }

      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand('copy');
      textArea.remove();

      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return true;
      }

      return false;
    } catch (err) {
      console.error('Failed to copy:', err);
      return false;
    }
  }, []);

  return { copy, copied };
}

/**
 * Hook for keyboard shortcuts
 */
export function useKeyboardShortcuts(handlers: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + C
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'C') {
        event.preventDefault();
        handlers['toggle-widget']?.();
      }

      // Ctrl/Cmd + Shift + V
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'V') {
        event.preventDefault();
        handlers['paste-all']?.();
      }

      // Escape
      if (event.key === 'Escape') {
        handlers['close']?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
