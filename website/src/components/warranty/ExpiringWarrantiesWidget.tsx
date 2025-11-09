'use client';

// Expiring Warranties Widget Component

import { useEffect, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { AlertCircle, Calendar, Clock, AlertTriangle } from 'lucide-react';

interface ExpiringWarranty {
  id: string;
  productName: string;
  manufacturer: string;
  warrantyType: string;
  expiryDate: Date;
  daysRemaining: number;
  status: string;
  productId?: string;
}

interface Props {
  daysAhead?: number;
  maxItems?: number;
  showViewAll?: boolean;
}

export default function ExpiringWarrantiesWidget({
  daysAhead = 30,
  maxItems = 5,
  showViewAll = true,
}: Props) {
  const [warranties, setWarranties] = useState<ExpiringWarranty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExpiringWarranties();
  }, [daysAhead]);

  async function fetchExpiringWarranties() {
    try {
      setLoading(true);
      const response = await fetch(`/api/warranties/expiring?days=${daysAhead}`);

      if (!response.ok) {
        throw new Error('Failed to fetch expiring warranties');
      }

      const data = await response.json();
      setWarranties(data.warranties.slice(0, maxItems));
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching expiring warranties:', err);
    } finally {
      setLoading(false);
    }
  }

  function getUrgencyColor(daysRemaining: number): string {
    if (daysRemaining <= 1) return 'text-red-600 bg-red-50';
    if (daysRemaining <= 7) return 'text-orange-600 bg-orange-50';
    if (daysRemaining <= 30) return 'text-yellow-600 bg-yellow-50';
    return 'text-blue-600 bg-blue-50';
  }

  function getUrgencyIcon(daysRemaining: number) {
    if (daysRemaining <= 7) {
      return <AlertTriangle className="h-5 w-5" />;
    }
    return <AlertCircle className="h-5 w-5" />;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Clock className="h-6 w-6 text-indigo-600" />
          Expiring Soon
        </h2>
        {warranties.length > 0 && (
          <span className="text-sm text-gray-500">Next {daysAhead} days</span>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {warranties.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            No warranties expiring in the next {daysAhead} days
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {warranties.map((warranty) => (
            <div
              key={warranty.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                if (warranty.productId) {
                  window.location.href = `/dashboard/products/${warranty.productId}`;
                }
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {warranty.productName}
                  </h3>
                  <p className="text-sm text-gray-600">{warranty.manufacturer}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-500">
                      Expires: {format(new Date(warranty.expiryDate), 'MMM d, yyyy')}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {warranty.warrantyType}
                    </span>
                  </div>
                </div>
                <div
                  className={`flex items-center gap-2 px-3 py-1 rounded-full ${getUrgencyColor(
                    warranty.daysRemaining
                  )}`}
                >
                  {getUrgencyIcon(warranty.daysRemaining)}
                  <span className="text-sm font-semibold">
                    {warranty.daysRemaining === 0
                      ? 'Today'
                      : warranty.daysRemaining === 1
                      ? 'Tomorrow'
                      : `${warranty.daysRemaining}d`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showViewAll && warranties.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <a
            href="/dashboard/warranties"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center justify-center gap-1"
          >
            View all warranties →
          </a>
        </div>
      )}
    </div>
  );
}
