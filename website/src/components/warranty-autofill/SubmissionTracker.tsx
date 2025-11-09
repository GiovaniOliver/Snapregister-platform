'use client';

import { useState } from 'react';
import type { FormSubmission, ManufacturerFormTemplate } from '@/lib/types/warranty-autofill';

export interface SubmissionTrackerProps {
  submission: FormSubmission;
  template?: ManufacturerFormTemplate;
  onMarkComplete?: () => void;
  onAbandon?: () => void;
  onRateExperience?: (rating: number, feedback: string) => void;
  className?: string;
}

export function SubmissionTracker({
  submission,
  template,
  onMarkComplete,
  onAbandon,
  onRateExperience,
  className = '',
}: SubmissionTrackerProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  const progressPercentage = (submission.currentStep / submission.totalSteps) * 100;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'ABANDONED':
        return 'bg-gray-100 text-gray-600';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'COMPLETED':
        return 'Completed';
      case 'ABANDONED':
        return 'Abandoned';
      case 'FAILED':
        return 'Failed';
      default:
        return status;
    }
  };

  const handleComplete = () => {
    onMarkComplete?.();
    setShowFeedback(true);
  };

  const handleSubmitFeedback = () => {
    onRateExperience?.(rating, feedback);
    setShowFeedback(false);
  };

  const timeElapsed = submission.startedAt
    ? Math.floor((new Date().getTime() - new Date(submission.startedAt).getTime()) / 1000 / 60)
    : 0;

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Submission Progress
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
              {getStatusLabel(submission.status)}
            </span>
          </div>
          {submission.status === 'IN_PROGRESS' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onAbandon?.()}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Abandon
              </button>
              <button
                onClick={handleComplete}
                className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
              >
                Mark Complete
              </button>
            </div>
          )}
        </div>

        {/* Time Elapsed */}
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            Time elapsed: {timeElapsed} minutes
            {template && ` / ${template.estimatedTime} min estimated`}
          </span>
        </div>
      </div>

      {/* Progress Section */}
      <div className="px-6 py-4">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-semibold text-gray-900">
              {progressPercentage.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Step {submission.currentStep} of {submission.totalSteps}
          </p>
        </div>

        {/* Copied Fields */}
        {submission.copiedFields.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Fields Copied ({submission.copiedFields.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {submission.copiedFields.map((field) => (
                <span
                  key={field}
                  className="px-2 py-1 bg-green-50 text-green-700 rounded-md text-xs font-medium border border-green-200"
                >
                  {field}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Completion Details */}
        {submission.completedAt && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-green-900">
                  Registration completed successfully!
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Completed on {new Date(submission.completedAt).toLocaleString()}
                </p>
                {submission.wasHelpful !== undefined && (
                  <p className="text-sm text-green-700 mt-1">
                    Your rating: {submission.difficultyRating ? `${submission.difficultyRating}/5` : 'Not rated'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Feedback Section */}
      {showFeedback && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">
            How was your experience?
          </h4>

          {/* Rating Stars */}
          <div className="mb-4">
            <p className="text-sm text-gray-700 mb-2">Rate the difficulty:</p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  aria-label={`Rate ${star} stars`}
                >
                  <svg
                    className={`h-8 w-8 ${
                      star <= rating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              1 = Very Easy, 5 = Very Difficult
            </p>
          </div>

          {/* Feedback Text */}
          <div className="mb-4">
            <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
              Any feedback or suggestions?
            </label>
            <textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              placeholder="Tell us about your experience..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSubmitFeedback}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Submit Feedback
            </button>
            <button
              onClick={() => setShowFeedback(false)}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export interface SubmissionHistoryProps {
  submissions: FormSubmission[];
  onViewSubmission?: (submissionId: string) => void;
  className?: string;
}

export function SubmissionHistory({
  submissions,
  onViewSubmission,
  className = '',
}: SubmissionHistoryProps) {
  if (submissions.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-8 text-center ${className}`}>
        <svg className="h-12 w-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          No submission history
        </h3>
        <p className="text-sm text-gray-600">
          Start filling out a form to see your submission history here
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Submission History
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {submissions.length} {submissions.length === 1 ? 'submission' : 'submissions'}
        </p>
      </div>
      <div className="divide-y divide-gray-200">
        {submissions.map((submission) => {
          const progress = (submission.currentStep / submission.totalSteps) * 100;
          const timeAgo = submission.startedAt
            ? Math.floor((new Date().getTime() - new Date(submission.startedAt).getTime()) / 1000 / 60)
            : 0;

          return (
            <div
              key={submission.id}
              className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => onViewSubmission?.(submission.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      Template ID: {submission.templateId.slice(0, 8)}...
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        submission.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-800'
                          : submission.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {submission.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Started {timeAgo} minutes ago
                  </p>
                  <div className="mt-2">
                    <div className="w-48 bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Step {submission.currentStep} of {submission.totalSteps}
                    </p>
                  </div>
                </div>
                {submission.difficultyRating && (
                  <div className="ml-4 flex items-center gap-1">
                    <svg className="h-4 w-4 text-yellow-400 fill-current" viewBox="0 0 24 24">
                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">
                      {submission.difficultyRating}/5
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
