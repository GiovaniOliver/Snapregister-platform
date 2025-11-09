'use client';

import React from 'react';
import {
  Calendar,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Mail,
  Globe,
  FileText,
  Clock,
  Info,
  XCircle,
} from 'lucide-react';
import { WarrantyAnalysis } from '@/types/warrantyAnalysis';

interface WarrantyAnalysisDisplayProps {
  analysis: WarrantyAnalysis;
}

export default function WarrantyAnalysisDisplay({ analysis }: WarrantyAnalysisDisplayProps) {
  const formatDate = (date: string | Date | undefined) => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getConfidenceColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (score?: number) => {
    if (!score) return 'Unknown';
    if (score >= 0.8) return 'High Confidence';
    if (score >= 0.6) return 'Medium Confidence';
    return 'Low Confidence - Review Needed';
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Warranty Analysis Complete
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              AI-powered extraction from {analysis.file_name}
            </p>
          </div>
          <div className="text-right">
            <div className={`text-sm font-semibold ${getConfidenceColor(analysis.confidence_score)}`}>
              {getConfidenceLabel(analysis.confidence_score)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {analysis.confidence_score
                ? `${(analysis.confidence_score * 100).toFixed(0)}% confidence`
                : 'N/A'}
            </div>
          </div>
        </div>

        {/* AI Summary */}
        {analysis.ai_summary && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
              <Info className="w-5 h-5" />
              Summary
            </h3>
            <p className="text-blue-800 dark:text-blue-200">{analysis.ai_summary}</p>
          </div>
        )}
      </div>

      {/* Critical Highlights */}
      {analysis.critical_highlights.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h3 className="font-bold text-red-900 dark:text-red-100 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            Critical - Must Know
          </h3>
          <ul className="space-y-3">
            {analysis.critical_highlights.map((highlight, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="text-2xl">{highlight.icon}</span>
                <p className="text-red-800 dark:text-red-200 flex-1">{highlight.text}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warning Highlights */}
      {analysis.warning_highlights.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <h3 className="font-bold text-yellow-900 dark:text-yellow-100 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            Important Warnings
          </h3>
          <ul className="space-y-3">
            {analysis.warning_highlights.map((highlight, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="text-2xl">{highlight.icon}</span>
                <p className="text-yellow-800 dark:text-yellow-200 flex-1">{highlight.text}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warranty Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Duration */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Warranty Duration
          </h3>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {analysis.duration || 'Not specified'}
            </div>
            {analysis.duration_months && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {analysis.duration_months} months
              </div>
            )}
            {analysis.expiry_date && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400">Expires on</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {formatDate(analysis.expiry_date)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transferability */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            Transferability
          </h3>
          <div className="space-y-2">
            {analysis.transferable === true && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-6 h-6" />
                <span className="font-semibold">Transferable</span>
              </div>
            )}
            {analysis.transferable === false && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <XCircle className="w-6 h-6" />
                <span className="font-semibold">Non-Transferable</span>
              </div>
            )}
            {analysis.transferable === null && (
              <div className="text-gray-500 dark:text-gray-400">Not specified</div>
            )}
            {analysis.extended_options && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Extended Warranty Options
                </div>
                <p className="text-gray-900 dark:text-gray-100">{analysis.extended_options}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Coverage & Exclusions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* What's Covered */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            What's Covered
          </h3>
          {analysis.coverage_items.length > 0 ? (
            <ul className="space-y-2">
              {analysis.coverage_items.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">No coverage items specified</p>
          )}
        </div>

        {/* What's NOT Covered */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600" />
            What's NOT Covered
          </h3>
          {analysis.exclusions.length > 0 ? (
            <ul className="space-y-2">
              {analysis.exclusions.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-red-600 dark:text-red-400 mt-1">✗</span>
                  <span className="text-gray-700 dark:text-gray-300">{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">No exclusions specified</p>
          )}
        </div>
      </div>

      {/* Claim Procedure */}
      {analysis.claim_procedure && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            How to File a Claim
          </h3>
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {analysis.claim_procedure}
            </p>
          </div>

          {/* Required Documents */}
          {analysis.required_docs.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                Required Documents
              </h4>
              <ul className="space-y-1">
                {analysis.required_docs.map((doc, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <FileText className="w-4 h-4 text-gray-400" />
                    {doc}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Contact Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Phone className="w-5 h-5 text-blue-600" />
          Contact for Claims
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analysis.claim_contacts.phone && (
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Phone</div>
                <a
                  href={`tel:${analysis.claim_contacts.phone}`}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  {analysis.claim_contacts.phone}
                </a>
              </div>
            </div>
          )}
          {analysis.claim_contacts.email && (
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Email</div>
                <a
                  href={`mailto:${analysis.claim_contacts.email}`}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  {analysis.claim_contacts.email}
                </a>
              </div>
            </div>
          )}
          {analysis.claim_contacts.website && (
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Website</div>
                <a
                  href={analysis.claim_contacts.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Visit Website →
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Highlights */}
      {analysis.info_highlights.length > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <h3 className="font-bold text-green-900 dark:text-green-100 mb-4 flex items-center gap-2">
            <Info className="w-6 h-6" />
            Good to Know
          </h3>
          <ul className="space-y-3">
            {analysis.info_highlights.map((highlight, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="text-2xl">{highlight.icon}</span>
                <p className="text-green-800 dark:text-green-200 flex-1">{highlight.text}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
